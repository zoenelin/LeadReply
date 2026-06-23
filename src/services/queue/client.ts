import { Queue, type ConnectionOptions } from "bullmq"
import { env } from "@/lib/config/env"
import type { LeadReplyJobData } from "@/services/queue/types"
import { automationQueueName } from "@/services/queue/types"

let automationQueue:
  | Queue<LeadReplyJobData, unknown, string, LeadReplyJobData, unknown, string>
  | undefined

export class QueueUnavailableError extends Error {
  constructor(message = "Redis is not configured for background jobs.") {
    super(message)
    this.name = "QueueUnavailableError"
  }
}

export function isQueueConfigured() {
  return Boolean(env.REDIS_URL?.trim())
}

function getRedisUrl() {
  const redisUrl = env.REDIS_URL?.trim()

  if (!redisUrl) {
    throw new QueueUnavailableError(
      "REDIS_URL is required before queueing background jobs."
    )
  }

  return redisUrl
}

export function createQueueConnection() {
  return {
    url: getRedisUrl(),
    maxRetriesPerRequest: null,
  } satisfies ConnectionOptions
}

export function getAutomationQueue() {
  if (!automationQueue) {
    automationQueue = new Queue<
      LeadReplyJobData,
      unknown,
      string,
      LeadReplyJobData,
      unknown,
      string
    >(automationQueueName, {
      connection: createQueueConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: {
          age: 60 * 60 * 24 * 14,
          count: 1000,
        },
        removeOnFail: false,
      },
    })
  }

  return automationQueue
}

export async function closeQueueClients() {
  await automationQueue?.close()
  automationQueue = undefined
}
