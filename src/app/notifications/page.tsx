import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { buildNotifications } from "@/lib/notifications"
import { prisma } from "@/lib/prisma"
import { AppNav } from "../components/AppNav"

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

  return "bg-slate-100 text-slate-700"
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

  const [leads, missedCalls, conciergeIntakes, reviewRequests, followUpSteps] =
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
      prisma.conciergeIntake.findMany({
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
    conciergeIntakes,
    reviewRequests,
    followUpSteps,
  })
  const highPriorityCount = notifications.filter(
    (notification) => notification.priority === "HIGH"
  ).length

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 pb-28 sm:px-6 sm:py-8 md:pb-8">
      <div className="mx-auto max-w-5xl">
        <AppNav />

        <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-rose-700">
                Notification center
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                What needs attention
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                LeadReply watches new leads, overdue follow-ups, AI intakes,
                and review prompts so owners know what to do next.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 px-5 py-4">
              <p className="text-sm text-slate-500">High priority</p>
              <p className="mt-1 text-3xl font-bold text-slate-950">
                {highPriorityCount}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Total alerts</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {notifications.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">New leads</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {leads.filter((lead) => lead.status === "NEW").length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">AI intakes ready</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {
                  conciergeIntakes.filter(
                    (intake) => intake.status === "READY_FOR_OWNER"
                  ).length
                }
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                <p className="text-lg font-bold text-slate-950">
                  Nothing urgent right now
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  New leads, overdue tasks, and review prompts will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.href}
                  className="block rounded-2xl border border-slate-200 p-5 hover:bg-slate-50"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-slate-950">
                          {notification.title}
                        </h2>
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-bold ${priorityClassName(
                            notification.priority
                          )}`}
                        >
                          {notification.priority}
                        </span>
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                          {notification.category}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {notification.message}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-slate-500">
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
