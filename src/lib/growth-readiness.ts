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

export type GrowthActionCategory = "SEO" | "MARKETING" | "GENERAL"
export type GrowthActionPriority = "HIGH" | "MEDIUM" | "LOW"

export type GrowthActionItem = {
  key: string
  category: GrowthActionCategory
  title: string
  description: string
  href: string
  priority: GrowthActionPriority
  ready: boolean
}

type GrowthTaskLike = {
  title: string
  description: string
  category: string
  status: string
  priority: string
  dueAt?: Date | string | null
}

type MarketingCalendarItemLike = {
  title: string
  status: string
  scheduledFor?: Date | string | null
}

export type NextBestGrowthAction = {
  label: string
  title: string
  description: string
  href: string
  priority: GrowthActionPriority
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

export function getSeoActionPlan(
  business: GrowthSetupBusiness
): GrowthActionItem[] {
  return [
    {
      key: "seo-website",
      category: "SEO",
      title: "Confirm website URL",
      description: business.website
        ? `Website recorded: ${business.website}`
        : "Add the business website so LeadReply can point SEO work at the right pages.",
      href: "/settings/business",
      priority: "HIGH",
      ready: hasValue(business.website),
    },
    {
      key: "seo-google-profile",
      category: "SEO",
      title: "Add Google Business Profile link",
      description: business.googleBusinessProfileUrl
        ? "Google profile link is ready for local visibility and review prompts."
        : "Add the Google Business Profile URL so local SEO tasks can reference the real listing.",
      href: "/settings/automation",
      priority: "HIGH",
      ready: hasValue(business.googleBusinessProfileUrl),
    },
    {
      key: "seo-services",
      category: "SEO",
      title: "List services to rank for",
      description: business.seoPrimaryServices
        ? business.seoPrimaryServices
        : "Add the highest-value services customers search for before calling.",
      href: "/settings/growth",
      priority: "HIGH",
      ready: hasValue(business.seoPrimaryServices),
    },
    {
      key: "seo-service-areas",
      category: "SEO",
      title: "Define local service areas",
      description: business.seoServiceAreas
        ? business.seoServiceAreas
        : "Add cities, neighborhoods, counties, or service radius for local search coverage.",
      href: "/settings/growth",
      priority: "HIGH",
      ready: hasValue(business.seoServiceAreas),
    },
    {
      key: "seo-keywords",
      category: "SEO",
      title: "Choose target keywords",
      description: business.seoTargetKeywords
        ? business.seoTargetKeywords
        : "Write the search phrases customers might use, such as service plus city or near me terms.",
      href: "/settings/growth",
      priority: "MEDIUM",
      ready: hasValue(business.seoTargetKeywords),
    },
    {
      key: "seo-page-plan",
      category: "SEO",
      title: "Plan website pages",
      description: business.seoWebsitePages
        ? business.seoWebsitePages
        : "Name the homepage, service pages, location pages, or FAQ pages that need SEO work.",
      href: "/settings/growth",
      priority: "MEDIUM",
      ready: hasValue(business.seoWebsitePages),
    },
    {
      key: "seo-content-ideas",
      category: "SEO",
      title: "Capture SEO content ideas",
      description: business.seoContentIdeas
        ? business.seoContentIdeas
        : "Collect customer questions, seasonal topics, and before-and-after ideas for future content.",
      href: "/settings/growth",
      priority: "LOW",
      ready: hasValue(business.seoContentIdeas),
    },
  ]
}

export function getMarketingActionPlan(
  business: GrowthSetupBusiness
): GrowthActionItem[] {
  return [
    {
      key: "marketing-channels",
      category: "MARKETING",
      title: "Pick marketing channels",
      description: business.marketingChannels
        ? business.marketingChannels
        : "Choose the channels this business will actually use first.",
      href: "/settings/growth",
      priority: "HIGH",
      ready: hasValue(business.marketingChannels),
    },
    {
      key: "marketing-audience",
      category: "MARKETING",
      title: "Define target audience",
      description: business.marketingAudience
        ? business.marketingAudience
        : "Describe the customer segments this business wants more of.",
      href: "/settings/growth",
      priority: "HIGH",
      ready: hasValue(business.marketingAudience),
    },
    {
      key: "marketing-goals",
      category: "MARKETING",
      title: "Set campaign goals",
      description: business.marketingGoals
        ? business.marketingGoals
        : "Pick whether marketing should drive calls, bookings, reviews, awareness, or repeat customers.",
      href: "/settings/growth",
      priority: "HIGH",
      ready: hasValue(business.marketingGoals),
    },
    {
      key: "marketing-offer",
      category: "MARKETING",
      title: "Create the offer",
      description: business.marketingOffer
        ? business.marketingOffer
        : "Add the promotion, seasonal package, or reason a customer should respond now.",
      href: "/settings/growth",
      priority: "MEDIUM",
      ready: hasValue(business.marketingOffer),
    },
    {
      key: "marketing-themes",
      category: "MARKETING",
      title: "Choose content themes",
      description: business.marketingContentThemes
        ? business.marketingContentThemes
        : "Add repeatable topics like tips, transformations, staff intros, customer stories, or reminders.",
      href: "/settings/growth",
      priority: "MEDIUM",
      ready: hasValue(business.marketingContentThemes),
    },
    {
      key: "marketing-voice",
      category: "MARKETING",
      title: "Set brand voice",
      description: business.marketingBrandVoice
        ? business.marketingBrandVoice
        : "Choose the tone marketing should use so social posts feel consistent.",
      href: "/settings/growth",
      priority: "LOW",
      ready: hasValue(business.marketingBrandVoice),
    },
  ]
}

export function getGrowthActionPlan(
  business: GrowthSetupBusiness
): GrowthActionItem[] {
  return [
    ...(hasSeoAccess(business.selectedPlan) ? getSeoActionPlan(business) : []),
    ...(hasMarketingAccess(business.selectedPlan)
      ? getMarketingActionPlan(business)
      : []),
  ]
}

function priorityScore(priority: string) {
  if (priority === "HIGH") {
    return 3
  }

  if (priority === "MEDIUM") {
    return 2
  }

  return 1
}

function dueTime(value?: Date | string | null) {
  if (!value) {
    return Number.POSITIVE_INFINITY
  }

  const date = value instanceof Date ? value : new Date(value)

  return Number.isNaN(date.getTime())
    ? Number.POSITIVE_INFINITY
    : date.getTime()
}

export function getNextBestGrowthAction({
  business,
  growthTasks,
  marketingCalendarItems,
}: {
  business: GrowthSetupBusiness
  growthTasks: GrowthTaskLike[]
  marketingCalendarItems: MarketingCalendarItemLike[]
}): NextBestGrowthAction {
  const openTask = growthTasks
    .filter((task) => task.status !== "DONE")
    .sort(
      (left, right) =>
        priorityScore(right.priority) - priorityScore(left.priority) ||
        dueTime(left.dueAt) - dueTime(right.dueAt)
    )[0]

  if (openTask) {
    return {
      label: openTask.category === "MARKETING" ? "Marketing task" : "SEO task",
      title: openTask.title,
      description:
        openTask.description ||
        "Move this saved growth task forward so the launch work keeps momentum.",
      href: "/settings/growth",
      priority:
        openTask.priority === "HIGH" || openTask.priority === "LOW"
          ? openTask.priority
          : "MEDIUM",
    }
  }

  const nextSetupAction = getGrowthActionPlan(business).find(
    (action) => !action.ready
  )

  if (nextSetupAction) {
    return {
      label: `${nextSetupAction.category} setup`,
      title: nextSetupAction.title,
      description: nextSetupAction.description,
      href: nextSetupAction.href,
      priority: nextSetupAction.priority,
    }
  }

  if (hasMarketingAccess(business.selectedPlan)) {
    const needsApproval = marketingCalendarItems.find(
      (item) => item.status === "NEEDS_APPROVAL"
    )

    if (needsApproval) {
      return {
        label: "Approval",
        title: `Approve ${needsApproval.title}`,
        description:
          "This marketing calendar item is waiting for approval before it can be scheduled or posted.",
        href: "/settings/growth",
        priority: "HIGH",
      }
    }

    const draft = marketingCalendarItems.find(
      (item) => item.status === "DRAFT"
    )

    if (draft) {
      return {
        label: "Marketing calendar",
        title: `Schedule ${draft.title}`,
        description:
          "This calendar item is drafted. Give it a date or move it into approval so the campaign can continue.",
        href: "/settings/growth",
        priority: "MEDIUM",
      }
    }

    if (marketingCalendarItems.length === 0) {
      return {
        label: "Marketing calendar",
        title: "Plan the first marketing item",
        description:
          "Add the first post, campaign, or promotion so the Complete plan has a real publishing rhythm.",
        href: "/settings/growth",
        priority: "MEDIUM",
      }
    }
  }

  if (!hasSeoAccess(business.selectedPlan)) {
    return {
      label: "Plan options",
      title: "Review Growth and Complete options",
      description:
        "Upgrade paths unlock SEO setup, marketing planning, and the growth workbench.",
      href: "/settings/billing",
      priority: "LOW",
    }
  }

  return {
    label: "Growth workbench",
    title: "Review growth progress",
    description:
      "SEO and marketing setup are ready. Use the workbench to keep future tasks and calendar items moving.",
    href: "/settings/growth",
    priority: "LOW",
  }
}
