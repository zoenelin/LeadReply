type ResponseTrackable = {
  createdAt: Date
  repliedAt: Date | null
  status: string
}

export function minutesBetween(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
}

export function formatResponseDuration(minutes: number | null) {
  if (minutes === null) {
    return "No replies yet"
  }

  if (minutes < 1) {
    return "Under 1 min"
  }

  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours < 24) {
    return remainingMinutes === 0
      ? `${hours}h`
      : `${hours}h ${remainingMinutes}m`
  }

  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24

  return remainingHours === 0 ? `${days}d` : `${days}d ${remainingHours}h`
}

export function getResponseSpeedStats(calls: ResponseTrackable[]) {
  const now = new Date()
  const repliedCalls = calls.filter((call) => call.repliedAt)
  const waitingCalls = calls.filter(
    (call) => !call.repliedAt && call.status !== "REPLIED"
  )
  const responseMinutes = repliedCalls.map((call) =>
    minutesBetween(call.createdAt, call.repliedAt ?? call.createdAt)
  )
  const averageMinutes =
    responseMinutes.length === 0
      ? null
      : Math.round(
          responseMinutes.reduce((total, minutes) => total + minutes, 0) /
            responseMinutes.length
        )
  const fastestMinutes =
    responseMinutes.length === 0 ? null : Math.min(...responseMinutes)
  const sameDayRate =
    repliedCalls.length === 0
      ? 0
      : Math.round(
          (responseMinutes.filter((minutes) => minutes <= 1440).length /
            repliedCalls.length) *
            100
        )
  const oldestWaitingMinutes =
    waitingCalls.length === 0
      ? null
      : Math.max(
          ...waitingCalls.map((call) => minutesBetween(call.createdAt, now))
        )

  return {
    totalCount: calls.length,
    repliedCount: repliedCalls.length,
    waitingCount: waitingCalls.length,
    averageMinutes,
    fastestMinutes,
    sameDayRate,
    oldestWaitingMinutes,
  }
}

export function getResponseSpeedLabel(averageMinutes: number | null) {
  if (averageMinutes === null) {
    return "Start tracking"
  }

  if (averageMinutes <= 15) {
    return "Excellent"
  }

  if (averageMinutes <= 60) {
    return "Fast"
  }

  if (averageMinutes <= 240) {
    return "Needs attention"
  }

  return "Slow"
}

export function getResponseSpeedMessage(
  stats: ReturnType<typeof getResponseSpeedStats>
) {
  if (stats.repliedCount === 0 && stats.waitingCount === 0) {
    return "No missed-call response activity yet."
  }

  if (stats.waitingCount > 0) {
    return `${stats.waitingCount} missed call${
      stats.waitingCount === 1 ? "" : "s"
    } still need a reply.`
  }

  return `${stats.sameDayRate}% of replied missed calls were handled within a day.`
}
