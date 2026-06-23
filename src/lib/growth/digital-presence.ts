export type PresenceStatus =
  | "UNKNOWN"
  | "CONNECTED"
  | "MISSING"
  | "NEEDS_WORK"
  | "NOT_NEEDED"

export type DigitalPresenceBusiness = {
  website: string
  googleBusinessProfileUrl: string
  googleReviewUrl: string
  calendarBookingUrl: string
  websitePresenceStatus: string
  googleBusinessProfileStatus: string
  facebookPageUrl: string
  facebookPageStatus: string
  instagramProfileUrl: string
  instagramProfileStatus: string
  bookingLinkStatus: string
  reviewPlatformStatus: string
  brandAssetsStatus: string
  logoUrl: string
  brandAssetNotes: string
  digitalPresenceNotes: string
  wantsLeadReplySetupHelp: boolean
}

export type DigitalPresenceChecklistItem = {
  key: string
  label: string
  ready: boolean
  status: PresenceStatus
  summary: string
  opportunityType?: string
}

export type ServiceOpportunityInput = {
  type: string
  title: string
  description: string
  priority: "HIGH" | "MEDIUM" | "LOW"
  estimatedValueCents: number
}

function hasValue(value: string) {
  return value.trim().length > 0
}

export function normalizePresenceStatus(value: string): PresenceStatus {
  if (
    value === "CONNECTED" ||
    value === "MISSING" ||
    value === "NEEDS_WORK" ||
    value === "NOT_NEEDED"
  ) {
    return value
  }

  return "UNKNOWN"
}

function isReady(status: string, hasPrimaryValue = false) {
  const normalized = normalizePresenceStatus(status)

  return normalized === "CONNECTED" || normalized === "NOT_NEEDED" || hasPrimaryValue
}

function statusSummary(status: string, connected: string, missing: string) {
  const normalized = normalizePresenceStatus(status)

  if (normalized === "CONNECTED") {
    return connected
  }

  if (normalized === "NEEDS_WORK") {
    return `${connected}, but it needs improvement`
  }

  if (normalized === "NOT_NEEDED") {
    return "Marked not needed for this business"
  }

  return missing
}

export function getDigitalPresenceChecklist(
  business: DigitalPresenceBusiness
): DigitalPresenceChecklistItem[] {
  const websiteReady = isReady(
    business.websitePresenceStatus,
    hasValue(business.website)
  )
  const googleReady = isReady(
    business.googleBusinessProfileStatus,
    hasValue(business.googleBusinessProfileUrl)
  )
  const facebookReady = isReady(
    business.facebookPageStatus,
    hasValue(business.facebookPageUrl)
  )
  const instagramReady = isReady(
    business.instagramProfileStatus,
    hasValue(business.instagramProfileUrl)
  )
  const bookingReady = isReady(
    business.bookingLinkStatus,
    hasValue(business.calendarBookingUrl)
  )
  const reviewReady = isReady(
    business.reviewPlatformStatus,
    hasValue(business.googleReviewUrl)
  )
  const brandReady = isReady(
    business.brandAssetsStatus,
    hasValue(business.logoUrl) || hasValue(business.brandAssetNotes)
  )

  return [
    {
      key: "website",
      label: "Website",
      ready: websiteReady,
      status: normalizePresenceStatus(business.websitePresenceStatus),
      summary: business.website
        ? business.website
        : statusSummary(
            business.websitePresenceStatus,
            "Website is connected",
            "Website is missing or not recorded"
          ),
      opportunityType: websiteReady ? undefined : "WEBSITE_SETUP",
    },
    {
      key: "google-profile",
      label: "Google Business Profile",
      ready: googleReady,
      status: normalizePresenceStatus(business.googleBusinessProfileStatus),
      summary: business.googleBusinessProfileUrl
        ? business.googleBusinessProfileUrl
        : statusSummary(
            business.googleBusinessProfileStatus,
            "Google Business Profile is connected",
            "Google Business Profile is missing or not recorded"
          ),
      opportunityType: googleReady ? undefined : "GBP_SETUP",
    },
    {
      key: "facebook",
      label: "Facebook",
      ready: facebookReady,
      status: normalizePresenceStatus(business.facebookPageStatus),
      summary: business.facebookPageUrl
        ? business.facebookPageUrl
        : statusSummary(
            business.facebookPageStatus,
            "Facebook page is connected",
            "Facebook page is missing or not recorded"
          ),
      opportunityType: facebookReady ? undefined : "FACEBOOK_SETUP",
    },
    {
      key: "instagram",
      label: "Instagram",
      ready: instagramReady,
      status: normalizePresenceStatus(business.instagramProfileStatus),
      summary: business.instagramProfileUrl
        ? business.instagramProfileUrl
        : statusSummary(
            business.instagramProfileStatus,
            "Instagram profile is connected",
            "Instagram profile is missing or not recorded"
          ),
      opportunityType: instagramReady ? undefined : "INSTAGRAM_SETUP",
    },
    {
      key: "booking-link",
      label: "Booking link",
      ready: bookingReady,
      status: normalizePresenceStatus(business.bookingLinkStatus),
      summary: business.calendarBookingUrl
        ? business.calendarBookingUrl
        : statusSummary(
            business.bookingLinkStatus,
            "Booking path is connected",
            "Booking or reservation path is missing"
          ),
      opportunityType: bookingReady ? undefined : "BOOKING_SETUP",
    },
    {
      key: "reviews",
      label: "Review platform",
      ready: reviewReady,
      status: normalizePresenceStatus(business.reviewPlatformStatus),
      summary: business.googleReviewUrl
        ? business.googleReviewUrl
        : statusSummary(
            business.reviewPlatformStatus,
            "Review link is connected",
            "Review request destination is missing"
          ),
      opportunityType: reviewReady ? undefined : "REVIEW_SETUP",
    },
    {
      key: "brand-assets",
      label: "Brand assets",
      ready: brandReady,
      status: normalizePresenceStatus(business.brandAssetsStatus),
      summary:
        business.logoUrl ||
        business.brandAssetNotes ||
        statusSummary(
          business.brandAssetsStatus,
          "Brand assets are recorded",
          "Logo, photos, or brand details are missing"
        ),
      opportunityType: brandReady ? undefined : "BRAND_ASSETS",
    },
  ]
}

export function getDigitalPresenceStats(business: DigitalPresenceBusiness) {
  const checklist = getDigitalPresenceChecklist(business)
  const readyCount = checklist.filter((item) => item.ready).length
  const urgentCount = checklist.filter(
    (item) => !item.ready && item.status !== "NOT_NEEDED"
  ).length

  return {
    checklist,
    readyCount,
    totalCount: checklist.length,
    urgentCount,
    complete: readyCount === checklist.length,
  }
}

export function buildServiceOpportunities(
  business: DigitalPresenceBusiness
): ServiceOpportunityInput[] {
  const checklist = getDigitalPresenceChecklist(business)
  const opportunities: ServiceOpportunityInput[] = []

  for (const item of checklist) {
    if (item.ready || !item.opportunityType || item.status === "NOT_NEEDED") {
      continue
    }

    const priority = item.key === "website" || item.key === "google-profile"
      ? "HIGH"
      : item.key === "brand-assets"
        ? "LOW"
        : "MEDIUM"

    opportunities.push({
      type: item.opportunityType,
      title: `${item.label} setup opportunity`,
      description: `${item.label} is ${item.status.toLowerCase().replace("_", " ")}. LeadReply can track this as a future setup or optimization service.`,
      priority,
      estimatedValueCents:
        item.key === "website"
          ? 250000
          : item.key === "google-profile"
            ? 60000
            : item.key === "brand-assets"
              ? 50000
              : 40000,
    })
  }

  if (
    business.wantsLeadReplySetupHelp &&
    checklist.some(
      (item) =>
        (item.key === "facebook" || item.key === "instagram") && !item.ready
    )
  ) {
    opportunities.push({
      type: "SOCIAL_MANAGEMENT",
      title: "Monthly social management opportunity",
      description:
        "Social channels are missing or need work. This could become a future recurring Complete-plan or done-for-you social service.",
      priority: "MEDIUM",
      estimatedValueCents: 100000,
    })
  }

  return opportunities
}
