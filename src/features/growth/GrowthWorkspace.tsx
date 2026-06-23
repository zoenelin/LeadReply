import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { AppNav } from "@/components/AppNav"
import { prisma } from "@/lib/data/prisma"
import {
  getGrowthReadinessStats,
} from "@/lib/growth/growth-readiness"
import { getBusinessAccessForSession } from "@/services/auth/business-access"
import { GrowthRequestBoard } from "./GrowthRequestBoard"

type GrowthWorkspaceProps = {
  focus: "seo" | "marketing" | "growth"
}

type ReadinessSummaryItem = {
  ready: boolean
}

function readinessSummary(items: ReadinessSummaryItem[]) {
  const readyCount = items.filter((item) => item.ready).length

  return `${readyCount}/${items.length} ready`
}

export async function GrowthWorkspace({ focus }: GrowthWorkspaceProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const access = await getBusinessAccessForSession(
    session,
    focus === "growth"
      ? "requestGrowthServices"
      : focus === "seo"
        ? "manageSeo"
        : "manageMarketing"
  )

  if (!access) {
    redirect("/dashboard")
  }

  const business = await prisma.business.findUnique({
    where: {
      id: access.businessId,
    },
    include: {
      growthTasks: {
        orderBy: [
          {
            status: "asc",
          },
          {
            createdAt: "desc",
          },
        ],
      },
      marketingCalendarItems: {
        orderBy: [
          {
            status: "asc",
          },
          {
            scheduledFor: "asc",
          },
          {
            createdAt: "desc",
          },
        ],
      },
      websiteAuditRuns: {
        orderBy: {
          checkedAt: "desc",
        },
        take: 1,
      },
      growthPlans: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  })

  if (!business) {
    redirect("/settings/business")
  }

  const growthStats = getGrowthReadinessStats(business)
  const isSeo = focus === "seo"
  const isGrowth = focus === "growth"
  const accessAllowed = isGrowth
    ? growthStats.seoAccess || growthStats.marketingAccess
    : isSeo
      ? growthStats.seoAccess
      : growthStats.marketingAccess
  const readinessItems = isGrowth
    ? [
        ...growthStats.digitalPresenceChecklist,
        ...growthStats.seoChecklist,
        ...growthStats.marketingChecklist,
      ]
    : isSeo
      ? [
          ...growthStats.digitalPresenceChecklist,
          ...growthStats.seoChecklist,
        ]
      : growthStats.marketingChecklist
  const title = isGrowth ? "Growth" : isSeo ? "SEO" : "Marketing"
  const eyebrow = isGrowth ? "SEO and marketing" : isSeo ? "SEO module" : "Marketing module"
  const description = isGrowth
    ? "Request SEO or marketing help, approve drafts, and let LeadReply handle the planning and execution work."
    : isSeo
      ? "Request local SEO work, see audit progress, and let LeadReply handle the setup work."
      : "Request marketing work, approve drafts, and let LeadReply handle channel choices, campaigns, and content planning."

  return (
    <main className="min-h-screen bg-lr-page px-4 py-6 pb-10 sm:px-6 sm:py-8 md:pb-8">
      <div className="mx-auto max-w-[1600px]">
        <AppNav />

        <section className="mt-8 rounded-2xl bg-lr-surface p-5 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-3xl font-black text-lr-strong">
                {title}
              </h1>
              <p className="mt-3 max-w-3xl text-lr-muted">
                {description}
              </p>
            </div>
            <div className="rounded-2xl border border-lr-border bg-lr-surface-muted px-5 py-4">
              <p className="text-sm font-bold text-lr-subtle">
                LeadReply info
              </p>
              <p className="mt-1 text-2xl font-black text-lr-strong">
                {readinessSummary(readinessItems)}
              </p>
            </div>
          </div>

          <GrowthRequestBoard
            focus={focus}
            accessAllowed={accessAllowed}
            planLabel={isSeo || isGrowth ? "Growth or Complete" : "Complete"}
            readinessItems={readinessItems.map((item) => ({
              label: item.label,
              ready: item.ready,
              summary: item.summary,
            }))}
            growthTasks={business.growthTasks.map((task) => ({
              id: task.id,
              title: task.title,
              description: task.description,
              category: task.category,
              status: task.status,
              priority: task.priority,
              dueAt: task.dueAt?.toISOString() ?? "",
              createdAt: task.createdAt.toISOString(),
            }))}
            marketingCalendarItems={business.marketingCalendarItems.map(
              (item) => ({
                id: item.id,
                title: item.title,
                channel: item.channel,
                campaignGoal: item.campaignGoal,
                contentTheme: item.contentTheme,
                offer: item.offer,
                status: item.status,
                scheduledFor: item.scheduledFor?.toISOString() ?? "",
                notes: item.notes,
                createdAt: item.createdAt.toISOString(),
              })
            )}
            latestAudit={
              business.websiteAuditRuns[0]
                ? {
                    score: business.websiteAuditRuns[0].score,
                    summary: business.websiteAuditRuns[0].summary,
                    checkedAt:
                      business.websiteAuditRuns[0].checkedAt.toISOString(),
                  }
                : null
            }
            latestPlan={
              business.growthPlans[0]
                ? {
                    title: business.growthPlans[0].title,
                    summary: business.growthPlans[0].summary,
                    source: business.growthPlans[0].source,
                    createdAt: business.growthPlans[0].createdAt.toISOString(),
                  }
                : null
            }
          />
        </section>
      </div>
    </main>
  )
}
