import { Prisma } from "@prisma/client"
import { generateGrowthPlan } from "@/services/ai/growth-plan"
import { formatApprovedBusinessMemoryForPrompt } from "@/services/business-memory/memory"
import { recordAiUsage } from "@/services/observability/ai-usage"
import { prisma } from "@/lib/data/prisma"

export async function runGrowthPlanJob({
  businessId,
}: {
  businessId: string
}) {
  const business = await prisma.business.findUnique({
    where: {
      id: businessId,
    },
  })

  if (!business) {
    throw new Error("Business not found for growth plan.")
  }

  const [auditFindings, leadCount, leadAnalytics, businessMemoryItems] =
    await Promise.all([
      prisma.websiteAuditFinding.findMany({
        where: {
          businessId: business.id,
          status: "OPEN",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 12,
      }),
      prisma.lead.count({
        where: {
          businessId: business.id,
        },
      }),
      prisma.lead.aggregate({
        where: {
          businessId: business.id,
        },
        _sum: {
          capturedValueCents: true,
        },
      }),
      prisma.businessMemoryItem.findMany({
        where: {
          businessId: business.id,
          status: "APPROVED",
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 24,
      }),
    ])
  const approvedMemory = formatApprovedBusinessMemoryForPrompt(
    businessMemoryItems
  )
  const generatedPlan = await generateGrowthPlan({
    business: {
      ...business,
      approvedMemory,
    },
    auditFindings,
    leadCount,
    capturedRevenueCents: leadAnalytics._sum.capturedValueCents ?? 0,
  })
  const plan = await prisma.growthPlan.create({
    data: {
      businessId: business.id,
      title: generatedPlan.title,
      summary: generatedPlan.summary,
      status: "DRAFT",
      source: generatedPlan.aiProvider === "OPENAI" ? "AI" : "RULES",
      aiProvider: generatedPlan.aiProvider,
      aiModel: generatedPlan.aiModel,
      aiError: generatedPlan.aiError,
      businessMemory: JSON.parse(
        JSON.stringify(generatedPlan.businessMemory)
      ) as Prisma.InputJsonValue,
      recommendations: JSON.parse(
        JSON.stringify(generatedPlan.recommendations)
      ) as Prisma.InputJsonValue,
    },
  })
  const taskRecommendations = generatedPlan.recommendations.slice(0, 5)
  const marketingRecommendations = generatedPlan.recommendations
    .filter((recommendation) => recommendation.category === "MARKETING")
    .slice(0, 2)

  await recordAiUsage({
    businessId: business.id,
    feature: "GROWTH_PLAN",
    provider: generatedPlan.aiProvider,
    model: generatedPlan.aiModel,
    inputTokens: generatedPlan.inputTokens,
    outputTokens: generatedPlan.outputTokens,
    status:
      generatedPlan.aiProvider === "RULES"
        ? "SKIPPED"
        : generatedPlan.aiError
          ? "ERROR"
          : "SUCCESS",
    error: generatedPlan.aiError,
  })

  await prisma.$transaction([
    ...taskRecommendations.map((recommendation) =>
      prisma.growthTask.create({
        data: {
          businessId: business.id,
          title: recommendation.title,
          description: recommendation.suggestedAction,
          category:
            recommendation.category === "MARKETING"
              ? "MARKETING"
              : recommendation.category === "SEO"
                ? "SEO"
                : "GENERAL",
          priority: recommendation.priority,
          source: generatedPlan.aiProvider === "OPENAI" ? "AI_PLAN" : "RULES_PLAN",
        },
      })
    ),
    ...marketingRecommendations.map((recommendation) =>
      prisma.marketingCalendarItem.create({
        data: {
          businessId: business.id,
          title: recommendation.title,
          channel: business.marketingChannels || "Owner review",
          campaignGoal: business.marketingGoals || "More captured leads",
          contentTheme: recommendation.suggestedAction,
          offer: business.marketingOffer,
          status: "NEEDS_APPROVAL",
          notes: recommendation.description,
        },
      })
    ),
  ])

  return {
    planId: plan.id,
    aiProvider: generatedPlan.aiProvider,
    aiModel: generatedPlan.aiModel,
    recommendationCount: generatedPlan.recommendations.length,
    tasksCreated: taskRecommendations.length,
    marketingDraftsCreated: marketingRecommendations.length,
  }
}
