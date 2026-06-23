import "dotenv/config"
import { Prisma } from "@prisma/client"
import { Worker } from "bullmq"
import { prisma } from "@/lib/data/prisma"
import { opsJobStatuses } from "@/lib/domain/status"
import { runAutomationJob } from "@/services/jobs"
import { logger } from "@/services/observability/logger"
import { createQueueConnection } from "@/services/queue/client"
import {
  automationQueueName,
  type LeadReplyJobData,
} from "@/services/queue/types"

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue
}

function getConcurrency() {
  const value = Number(process.env.WORKER_CONCURRENCY ?? "3")

  if (!Number.isFinite(value) || value < 1) {
    return 3
  }

  return Math.min(10, Math.floor(value))
}

async function markRunning(data: LeadReplyJobData, attemptsMade: number) {
  await prisma.opsJobRun.update({
    where: {
      id: data.opsJobRunId,
    },
    data: {
      status: opsJobStatuses.running,
      attemptsMade,
      startedAt: new Date(),
      lastHeartbeatAt: new Date(),
      error: "",
    },
  })
}

async function markSucceeded(data: LeadReplyJobData, result: unknown) {
  await prisma.opsJobRun.update({
    where: {
      id: data.opsJobRunId,
    },
    data: {
      status: opsJobStatuses.succeeded,
      result: toJson(result),
      finishedAt: new Date(),
      lastHeartbeatAt: new Date(),
      error: "",
    },
  })
}

async function markFailed({
  data,
  error,
  attemptsMade,
  maxAttempts,
}: {
  data: LeadReplyJobData
  error: unknown
  attemptsMade: number
  maxAttempts: number
}) {
  const message =
    error instanceof Error ? error.message : "Background job failed."
  const willRetry = attemptsMade < maxAttempts

  await prisma.opsJobRun.update({
    where: {
      id: data.opsJobRunId,
    },
    data: {
      status: willRetry ? opsJobStatuses.retrying : opsJobStatuses.failed,
      attemptsMade,
      error: message,
      finishedAt: willRetry ? null : new Date(),
      lastHeartbeatAt: new Date(),
    },
  })
}

const worker = new Worker<LeadReplyJobData>(
  automationQueueName,
  async (job) => {
    const data = job.data
    const attemptsMade = job.attemptsMade + 1
    const maxAttempts =
      typeof job.opts.attempts === "number" ? job.opts.attempts : 1

    await markRunning(data, attemptsMade)

    try {
      const result = await runAutomationJob(data)

      await markSucceeded(data, result)

      return result
    } catch (error) {
      await markFailed({
        data,
        error,
        attemptsMade,
        maxAttempts,
      })

      throw error
    }
  },
  {
    connection: createQueueConnection(),
    concurrency: getConcurrency(),
  }
)

worker.on("ready", () => {
  logger.info("worker.ready", {
    queueName: automationQueueName,
    concurrency: getConcurrency(),
  })
})

worker.on("failed", (job, error) => {
  logger.error("worker.job.failed", {
    queueName: automationQueueName,
    jobId: job?.id,
    opsJobRunId: job?.data.opsJobRunId,
    error,
  })
})

worker.on("completed", (job) => {
  logger.info("worker.job.completed", {
    queueName: automationQueueName,
    jobId: job.id,
    opsJobRunId: job.data.opsJobRunId,
  })
})

async function shutdown(signal: string) {
  logger.info("worker.shutdown", {
    signal,
  })
  await worker.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on("SIGINT", () => void shutdown("SIGINT"))
process.on("SIGTERM", () => void shutdown("SIGTERM"))
