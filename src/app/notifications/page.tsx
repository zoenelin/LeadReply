import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { buildNotifications } from "@/lib/domain/notifications"
import { prisma } from "@/lib/data/prisma"
import { AppNav } from "@/components/AppNav"

export const metadata: Metadata = {
  title: "Alerts",
  description: "LeadReply alerts for new leads, overdue follow-ups, and review tasks.",
  robots: {
    index: false,
    follow: false,
  },
}

function formatNotificationDate(value: Date | string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function priorityClassName(priority: string) {
  if (priority === "HIGH") {
    return "bg-rose-50 text-rose-700"
  }

  if (priority === "MEDIUM") {
    return "bg-amber-50 text-amber-700"
  }

  return "bg-lr-hover text-lr-body"
}

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
    },
  })

  if (!business) {
    redirect("/settings/business")
  }

  const [leads, missedCalls, missedCallAssistantIntakes, reviewRequests, followUpSteps] =
    await Promise.all([
      prisma.lead.findMany({
        where: {
          businessId: business.id,
        },
        include: {
          reviewRequests: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.missedCall.findMany({
        where: {
          businessId: business.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.missedCallAssistantIntake.findMany({
        where: {
          businessId: business.id,
        },
        include: {
          missedCall: {
            select: {
              callerName: true,
              callerPhone: true,
            },
          },
          lead: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      }),
      prisma.reviewRequest.findMany({
        where: {
          businessId: business.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.followUpStep.findMany({
        where: {
          businessId: business.id,
        },
        include: {
          lead: {
            select: {
              id: true,
              customerName: true,
            },
          },
        },
        orderBy: {
          dueAt: "asc",
        },
      }),
    ])

  const notifications = buildNotifications({
    leads,
    missedCalls,
    missedCallAssistantIntakes,
    reviewRequests,
    followUpSteps,
  })
  const highPriorityCount = notifications.filter(
    (notification) => notification.priority === "HIGH"
  ).length

  return (
    <main className="min-h-screen bg-lr-page px-4 py-6 pb-10 sm:px-6 sm:py-8 md:pb-8">
      <div className="mx-auto max-w-[1400px]">
        <AppNav />

        <section className="mt-8 rounded-2xl bg-lr-surface p-5 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-rose-700">
                Notification center
              </p>
              <h1 className="mt-2 text-3xl font-bold text-lr-strong">
                What needs attention
              </h1>
              <p className="mt-3 max-w-2xl text-lr-muted">
                LeadReply watches new leads, overdue follow-ups, missed-call assistant intakes,
                and review prompts so owners know what to do next.
              </p>
            </div>
            <div className="rounded-2xl border border-lr-border px-5 py-4">
              <p className="text-sm text-lr-subtle">High priority</p>
              <p className="mt-1 text-3xl font-bold text-lr-strong">
                {highPriorityCount}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-lr-border p-5">
              <p className="text-sm text-lr-subtle">Total alerts</p>
              <p className="mt-2 text-3xl font-bold text-lr-strong">
                {notifications.length}
              </p>
            </div>
            <div className="rounded-2xl border border-lr-border p-5">
              <p className="text-sm text-lr-subtle">New leads</p>
              <p className="mt-2 text-3xl font-bold text-lr-strong">
                {leads.filter((lead) => lead.status === "NEW").length}
              </p>
            </div>
            <div className="rounded-2xl border border-lr-border p-5">
              <p className="text-sm text-lr-subtle">missed-call assistant intakes ready</p>
              <p className="mt-2 text-3xl font-bold text-lr-strong">
                {
                  missedCallAssistantIntakes.filter(
                    (intake) => intake.status === "READY_FOR_OWNER"
                  ).length
                }
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-lr-border-strong p-8 text-center">
                <p className="text-lg font-bold text-lr-strong">
                  Nothing urgent right now
                </p>
                <p className="mt-2 text-sm text-lr-muted">
                  New leads, overdue tasks, and review prompts will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.href}
                  className="block rounded-2xl border border-lr-border p-5 hover:bg-lr-hover"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-lr-strong">
                          {notification.title}
                        </h2>
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-bold ${priorityClassName(
                            notification.priority
                          )}`}
                        >
                          {notification.priority}
                        </span>
                        <span className="rounded-lg bg-lr-hover px-2 py-1 text-xs font-bold text-lr-body">
                          {notification.category}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-lr-muted">
                        {notification.message}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-lr-subtle">
                      {formatNotificationDate(notification.createdAt)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
