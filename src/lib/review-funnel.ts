export const reviewStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  RECEIVED: "Review received",
}

export type ReviewFunnelRequest = {
  id: string
  status: string
  customerName: string
  customerPhone: string
  message: string
  createdAt: Date
  sentAt: Date | null
  receivedAt: Date | null
  leadId: string | null
}

export type ReviewFunnelLead = {
  id: string
  customerName: string
  customerPhone: string
  status: string
  closedAt: Date | null
  reviewRequests: ReviewFunnelRequest[]
}

function percentage(part: number, whole: number) {
  if (whole === 0) {
    return 0
  }

  return Math.round((part / whole) * 100)
}

function hasSentOrReceivedRequest(lead: ReviewFunnelLead) {
  return lead.reviewRequests.some((request) =>
    ["SENT", "RECEIVED"].includes(request.status)
  )
}

function hasReceivedRequest(lead: ReviewFunnelLead) {
  return lead.reviewRequests.some((request) => request.status === "RECEIVED")
}

export function getReviewStatusLabel(status: string) {
  return reviewStatusLabels[status] ?? status
}

export function reviewStatusClassName(status: string) {
  if (status === "RECEIVED") {
    return "bg-emerald-50 text-emerald-700"
  }

  if (status === "SENT") {
    return "bg-sky-50 text-sky-700"
  }

  return "bg-amber-50 text-amber-700"
}

export function getReviewFunnelStats(leads: ReviewFunnelLead[]) {
  const capturedLeads = leads.filter((lead) => lead.status === "CAPTURED")
  const reviewRequests = leads.flatMap((lead) => lead.reviewRequests)
  const draftRequests = reviewRequests.filter(
    (request) => request.status === "DRAFT"
  )
  const sentRequests = reviewRequests.filter(
    (request) => request.status === "SENT"
  )
  const receivedRequests = reviewRequests.filter(
    (request) => request.status === "RECEIVED"
  )
  const requestedCapturedLeads = capturedLeads.filter(hasSentOrReceivedRequest)
  const reviewedCapturedLeads = capturedLeads.filter(hasReceivedRequest)
  const notRequestedCapturedLeads = capturedLeads.filter(
    (lead) => lead.reviewRequests.length === 0
  )
  const draftedCapturedLeads = capturedLeads.filter(
    (lead) =>
      lead.reviewRequests.length > 0 && !hasSentOrReceivedRequest(lead)
  )
  const sentOrReceivedRequests = sentRequests.length + receivedRequests.length

  return {
    capturedLeadCount: capturedLeads.length,
    requestCount: reviewRequests.length,
    draftCount: draftRequests.length,
    sentCount: sentRequests.length,
    receivedCount: receivedRequests.length,
    requestedCapturedLeadCount: requestedCapturedLeads.length,
    reviewedCapturedLeadCount: reviewedCapturedLeads.length,
    notRequestedCapturedLeads,
    draftedCapturedLeads,
    draftRequests,
    sentRequests,
    receivedRequests,
    requestRate: percentage(requestedCapturedLeads.length, capturedLeads.length),
    receivedRate: percentage(receivedRequests.length, sentOrReceivedRequests),
    funnelSteps: [
      {
        label: "Customers captured",
        count: capturedLeads.length,
        percent: capturedLeads.length === 0 ? 0 : 100,
      },
      {
        label: "Review requested",
        count: requestedCapturedLeads.length,
        percent: percentage(requestedCapturedLeads.length, capturedLeads.length),
      },
      {
        label: "Review received",
        count: reviewedCapturedLeads.length,
        percent: percentage(reviewedCapturedLeads.length, capturedLeads.length),
      },
    ],
  }
}

export function getReviewFunnelMessage(
  stats: ReturnType<typeof getReviewFunnelStats>
) {
  if (stats.capturedLeadCount === 0) {
    return "Capture a customer, then LeadReply will help ask for the review."
  }

  if (stats.notRequestedCapturedLeads.length > 0) {
    return `${stats.notRequestedCapturedLeads.length} captured customer${
      stats.notRequestedCapturedLeads.length === 1 ? "" : "s"
    } still need a review request.`
  }

  if (stats.sentCount > 0) {
    return `${stats.sentCount} sent request${
      stats.sentCount === 1 ? "" : "s"
    } can be checked for completed reviews.`
  }

  return "The review funnel is caught up for captured customers."
}
