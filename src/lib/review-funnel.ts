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
  const wonLeads = leads.filter((lead) => lead.status === "WON")
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
  const requestedWonLeads = wonLeads.filter(hasSentOrReceivedRequest)
  const reviewedWonLeads = wonLeads.filter(hasReceivedRequest)
  const notRequestedWonLeads = wonLeads.filter(
    (lead) => lead.reviewRequests.length === 0
  )
  const draftedWonLeads = wonLeads.filter(
    (lead) =>
      lead.reviewRequests.length > 0 && !hasSentOrReceivedRequest(lead)
  )
  const sentOrReceivedRequests = sentRequests.length + receivedRequests.length

  return {
    wonLeadCount: wonLeads.length,
    requestCount: reviewRequests.length,
    draftCount: draftRequests.length,
    sentCount: sentRequests.length,
    receivedCount: receivedRequests.length,
    requestedWonLeadCount: requestedWonLeads.length,
    reviewedWonLeadCount: reviewedWonLeads.length,
    notRequestedWonLeads,
    draftedWonLeads,
    draftRequests,
    sentRequests,
    receivedRequests,
    requestRate: percentage(requestedWonLeads.length, wonLeads.length),
    receivedRate: percentage(receivedRequests.length, sentOrReceivedRequests),
    funnelSteps: [
      {
        label: "Customers won",
        count: wonLeads.length,
        percent: wonLeads.length === 0 ? 0 : 100,
      },
      {
        label: "Review requested",
        count: requestedWonLeads.length,
        percent: percentage(requestedWonLeads.length, wonLeads.length),
      },
      {
        label: "Review received",
        count: reviewedWonLeads.length,
        percent: percentage(reviewedWonLeads.length, wonLeads.length),
      },
    ],
  }
}

export function getReviewFunnelMessage(
  stats: ReturnType<typeof getReviewFunnelStats>
) {
  if (stats.wonLeadCount === 0) {
    return "Win a customer, then LeadReply will help ask for the review."
  }

  if (stats.notRequestedWonLeads.length > 0) {
    return `${stats.notRequestedWonLeads.length} won customer${
      stats.notRequestedWonLeads.length === 1 ? "" : "s"
    } still need a review request.`
  }

  if (stats.sentCount > 0) {
    return `${stats.sentCount} sent request${
      stats.sentCount === 1 ? "" : "s"
    } can be checked for completed reviews.`
  }

  return "The review funnel is caught up for won customers."
}
