import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/data/prisma"
import { AppNav } from "@/components/AppNav"
import { CustomersJobsWorkspace } from "@/features/leads/CustomersJobsWorkspace"
import {
  getBusinessAccessForSession,
  hasBusinessCapability,
} from "@/services/auth/business-access"
import { toCustomerJobSavedView } from "@/services/crm/customer-job-views"

export const metadata: Metadata = {
  title: "Customers/Jobs",
  description:
    "Manage LeadReply customers, jobs, values, status, and follow-up timing.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function CustomersJobsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const access = await getBusinessAccessForSession(session, "manageLeads")

  if (!access) {
    redirect("/dashboard")
  }

  const business = await prisma.business.findUnique({
    where: {
      id: access.businessId,
    },
    include: {
      leads: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              status: true,
              estimatedValueCents: true,
              capturedValueCents: true,
              followUpAt: true,
              appointmentStatus: true,
              appointmentAt: true,
              updatedAt: true,
            },
          },
          reviewRequests: true,
          serviceOffering: {
            select: {
              id: true,
              name: true,
            },
          },
          marketingCampaign: {
            select: {
              id: true,
              name: true,
            },
          },
          missedCallAssistantIntakes: {
            orderBy: {
              updatedAt: "desc",
            },
            select: {
              status: true,
              quoteRequested: true,
              schedulingRequested: true,
              matchedServiceName: true,
            },
          },
        },
      },
      marketingCampaigns: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      crmViews: {
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  })

  if (!business) {
    redirect("/settings/business")
  }

  return (
    <main className="min-h-screen bg-lr-page px-3 py-4 pb-10 sm:px-5 lg:px-8 md:pb-8">
      <div className="mx-auto max-w-[1600px]">
        <AppNav />

        <section className="mt-6 rounded-xl border border-lr-border bg-lr-surface px-4 py-5 shadow-sm shadow-lr-shadow/20 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Customers/Jobs
              </p>
              <h1 className="mt-2 text-3xl font-bold text-lr-strong">
                Home-services customer and job workspace
              </h1>
              <p className="mt-3 max-w-2xl text-lr-muted">
                Track customers, services, status, next steps, appointments,
                and money made from one spreadsheet-simple workspace.
              </p>
            </div>
          </div>

          <CustomersJobsWorkspace
            leads={business.leads.map((lead) => ({
              ...lead,
              createdAt: lead.createdAt.toISOString(),
              closedAt: lead.closedAt?.toISOString() ?? null,
              followUpAt: lead.followUpAt?.toISOString() ?? null,
              followUpCompletedAt:
                lead.followUpCompletedAt?.toISOString() ?? null,
              appointmentAt: lead.appointmentAt?.toISOString() ?? null,
              job: lead.job
                ? {
                    ...lead.job,
                    followUpAt: lead.job.followUpAt?.toISOString() ?? null,
                    appointmentAt: lead.job.appointmentAt?.toISOString() ?? null,
                    updatedAt: lead.job.updatedAt.toISOString(),
                  }
                : null,
            }))}
            marketingCampaigns={business.marketingCampaigns}
            savedViews={business.crmViews.map(toCustomerJobSavedView)}
            canManageCrmViews={hasBusinessCapability(access, "manageCrmViews")}
          />
        </section>
      </div>
    </main>
  )
}
