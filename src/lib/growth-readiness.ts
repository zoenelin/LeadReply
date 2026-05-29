export type GrowthSetupBusiness = {
  selectedPlan: string
  website: string
  googleBusinessProfileUrl: string
  seoSetupNotes: string
  seoPrimaryServices: string
  seoServiceAreas: string
  seoTargetKeywords: string
  seoCompetitors: string
  seoWebsitePages: string
  seoContentIdeas: string
  marketingSetupNotes: string
  marketingChannels: string
  marketingAudience: string
  marketingGoals: string
  marketingOffer: string
  marketingContentThemes: string
  marketingPostingCadence: string
  marketingBrandVoice: string
}

export type GrowthChecklistItem = {
  label: string
  ready: boolean
  summary: string
}

function hasValue(value: string) {
  return value.trim().length > 0
}

function countReady(items: GrowthChecklistItem[]) {
  return items.filter((item) => item.ready).length
}

export function hasSeoAccess(plan: string) {
  return plan === "GROWTH" || plan === "COMPLETE"
}

export function hasMarketingAccess(plan: string) {
  return plan === "COMPLETE"
}

export function getSeoChecklist(
  business: GrowthSetupBusiness
): GrowthChecklistItem[] {
  return [
    {
      label: "Website",
      ready: hasValue(business.website),
      summary: business.website || "Website URL is not set",
    },
    {
      label: "Google Business Profile",
      ready: hasValue(business.googleBusinessProfileUrl),
      summary:
        business.googleBusinessProfileUrl ||
        "Google Business Profile link is not set",
    },
    {
      label: "Primary services",
      ready: hasValue(business.seoPrimaryServices),
      summary:
        business.seoPrimaryServices ||
        "Add the services this business wants to rank for",
    },
    {
      label: "Service areas",
      ready: hasValue(business.seoServiceAreas),
      summary:
        business.seoServiceAreas ||
        "Add cities, neighborhoods, or service radius",
    },
    {
      label: "Target keywords",
      ready: hasValue(business.seoTargetKeywords),
      summary:
        business.seoTargetKeywords ||
        "Add the phrases customers are likely to search",
    },
    {
      label: "Website page plan",
      ready: hasValue(business.seoWebsitePages),
      summary:
        business.seoWebsitePages ||
        "Add homepage, service page, and location page priorities",
    },
  ]
}

export function getMarketingChecklist(
  business: GrowthSetupBusiness
): GrowthChecklistItem[] {
  return [
    {
      label: "Marketing channels",
      ready: hasValue(business.marketingChannels),
      summary:
        business.marketingChannels ||
        "Choose the channels this business wants to use",
    },
    {
      label: "Target audience",
      ready: hasValue(business.marketingAudience),
      summary:
        business.marketingAudience ||
        "Define the customer segments this business wants more of",
    },
    {
      label: "Marketing goals",
      ready: hasValue(business.marketingGoals),
      summary:
        business.marketingGoals ||
        "Choose what the marketing should accomplish",
    },
    {
      label: "Offer or promotion",
      ready: hasValue(business.marketingOffer),
      summary:
        business.marketingOffer ||
        "Add the main offer, seasonal push, or reason to contact now",
    },
    {
      label: "Content themes",
      ready: hasValue(business.marketingContentThemes),
      summary:
        business.marketingContentThemes ||
        "Add repeatable topics for social posts and campaigns",
    },
    {
      label: "Brand voice",
      ready: hasValue(business.marketingBrandVoice),
      summary:
        business.marketingBrandVoice ||
        "Set the tone marketing content should use",
    },
  ]
}

export function getGrowthReadinessStats(business: GrowthSetupBusiness) {
  const seoChecklist = getSeoChecklist(business)
  const marketingChecklist = getMarketingChecklist(business)
  const seoReadyCount = countReady(seoChecklist)
  const marketingReadyCount = countReady(marketingChecklist)

  return {
    seoChecklist,
    marketingChecklist,
    seoReadyCount,
    marketingReadyCount,
    seoTotalCount: seoChecklist.length,
    marketingTotalCount: marketingChecklist.length,
    seoAccess: hasSeoAccess(business.selectedPlan),
    marketingAccess: hasMarketingAccess(business.selectedPlan),
    seoComplete: seoReadyCount === seoChecklist.length,
    marketingComplete: marketingReadyCount === marketingChecklist.length,
  }
}
