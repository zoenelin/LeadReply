import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/data/prisma"
import { opsJobStatuses } from "@/lib/domain/status"
import { logger } from "@/services/observability/logger"
import { getAutomationQueue } from "@/services/queue/client"
import {
  activeQueueStatuses,
  automationQueueName,
  isQueueJobType,
  type LeadReplyJobData,
  type QueueJobType,
} from "@/services/queue/types"

type EnqueueOpsJobInput = {
  type: QueueJobType
  name: string
  businessId?: string | null
  payload?: Record<string, unknown>
  details?: string
  source?: string
  dedupeKey?: string
  maxAttempts?: number
  delayMs?: number
  scheduledFor?: Date | null
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue
}

function cleanAttempts(value: number | undefined) {
  if (!value || value < 1) {
    return 3
  }

  return Math.min(10, Math.floor(value))
}

export async function enqueueOpsJob({
  type,
  name,
  businessId,
  payload = {},
  details = "",
  source = "APP",
  dedupeKey = "",
  maxAttempts,
  delayMs,
  scheduledFor,
}: EnqueueOpsJobInput) {
  if (dedupeKey) {
    const existing = await prisma.opsJobRun.findFirst({
      where: {
        dedupeKey,
        status: {
          in: [...activeQueueStatuses],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    if (existing) {
      return {
        jobRun: existing,
        deduped: true,
      }
    }
  }

  const attempts = cleanAttempts(maxAttempts)
  const queuedAt = new Date()
  const jobRun = await prisma.opsJobRun.create({
    data: {
      businessId: businessId || null,
      name,
      kind: type,
      status: opsJobStatuses.queued,
      source,
      queueName: automationQueueName,
      dedupeKey,
      details,
      maxAttempts: attempts,
      payload: toJson(payload),
      queuedAt,
      scheduledFor: scheduledFor ?? null,
    },
  })

  try {
    const queue = getAutomationQueue()
    const queueJob = await queue.add(
      type,
      {
        opsJobRunId: jobRun.id,
        type,
        businessId: businessId || null,
        payload,
        dedupeKey,
      },
      {
        jobId: jobRun.id,
        attempts,
        delay: delayMs,
      }
    )
    const updatedJobRun = await prisma.opsJobRun.update({
      where: {
        id: jobRun.id,
      },
      data: {
        queueJobId: String(queueJob.id ?? ""),
      },
    })

    logger.info("queue.job.enqueued", {
      jobRunId: updatedJobRun.id,
      queueJobId: updatedJobRun.queueJobId,
      type,
      businessId,
      dedupeKey,
    })

    return {
      jobRun: updatedJobRun,
      deduped: false,
    }
  } catch (error) {
    await prisma.opsJobRun.update({
      where: {
        id: jobRun.id,
      },
      data: {
        status: opsJobStatuses.failed,
        error:
          error instanceof Error
            ? error.message
            : "Could not add job to Redis queue.",
        finishedAt: new Date(),
      },
    })

    throw error
  }
}

export async function retryOpsJobRun(id: string) {
  const jobRun = await prisma.opsJobRun.findUnique({
    where: {
      id,
    },
  })

  if (!jobRun) {
    throw new Error("Job not found.")
  }

  if (!isQueueJobType(jobRun.kind)) {
    throw new Error("Only queued automation jobs can be retried.")
  }

  const queue = getAutomationQueue()
  const existingQueueJob = jobRun.queueJobId
    ? await queue.getJob(jobRun.queueJobId)
    : null

  if (existingQueueJob) {
    await existingQueueJob.remove()
  }

  const payload = (jobRun.payload ?? {}) as unknown as Record<string, unknown>
  const queueJob = await queue.add(
    jobRun.kind,
    {
      opsJobRunId: jobRun.id,
      type: jobRun.kind,
      businessId: jobRun.businessId,
      payload,
      dedupeKey: jobRun.dedupeKey,
    } satisfies LeadReplyJobData,
    {
      jobId: jobRun.id,
      attempts: jobRun.maxAttempts,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    }
  )

  return prisma.opsJobRun.update({
    where: {
      id: jobRun.id,
    },
    data: {
      status: opsJobStatuses.queued,
      queueName: automationQueueName,
      queueJobId: String(queueJob.id ?? ""),
      error: "",
      attemptsMade: 0,
      queuedAt: new Date(),
      startedAt: null,
      finishedAt: null,
      lastHeartbeatAt: null,
      result: toJson({}),
    },
  })
}

export async function cancelOpsJobRun(id: string) {
  const jobRun = await prisma.opsJobRun.findUnique({
    where: {
      id,
    },
  })

  if (!jobRun) {
    throw new Error("Job not found.")
  }

  if (jobRun.status === opsJobStatuses.running) {
    throw new Error("Running jobs cannot be safely cancelled from the web app yet.")
  }

  if (jobRun.queueJobId && jobRun.queueName) {
    const queue = getAutomationQueue()
    const queueJob = await queue.getJob(jobRun.queueJobId)

    if (queueJob) {
      await queueJob.remove()
    }
  }

  return prisma.opsJobRun.update({
    where: {
      id,
    },
    data: {
      status: opsJobStatuses.cancelled,
      finishedAt: new Date(),
    },
  })
}
