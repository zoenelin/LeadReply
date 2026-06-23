import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { SettingsShell } from "@/components/SettingsShell"
import { prisma } from "@/lib/data/prisma"
import { BusinessMemoryManager } from "@/features/core/BusinessMemoryManager"
import { getComplianceSummary } from "@/services/compliance/guardrails"
import { getBusinessAccessForSession } from "@/services/auth/business-access"

export const metadata: Metadata = {
  title: "Business Memory",
  description:
    "Import, review, and approve the business information LeadReply can use for automation.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function BusinessMemoryPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const access = await getBusinessAccessForSession(session, "manageAutomation")

  if (!access) {
    redirect("/dashboard")
  }

  const business = await prisma.business.findUnique({
    where: {
      id: access.businessId,
    },
    include: {
      businessMemorySources: {
        orderBy: {
          createdAt: "desc",
        },
        take: 12,
      },
      businessMemoryItems: {
        orderBy: [
          {
            status: "asc",
          },
          {
            updatedAt: "desc",
          },
        ],
      },
    },
  })

  if (!business) {
    redirect("/settings/business")
  }

  const compliance = getComplianceSummary({
    businessType: business.businessType,
    state: business.state,
  })

  return (
    <SettingsShell>
      <section className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-lr-strong">
            Business memory
          </h1>
          <p className="mt-3 max-w-3xl text-lr-muted">
            Build trusted LeadReply business knowledge from existing websites,
            files, exports, and connected software so owners do less manual
            setup.
          </p>
        </div>

        <BusinessMemoryManager
          sources={business.businessMemorySources.map((source) => ({
            id: source.id,
            sourceType: source.sourceType,
            sourceName: source.sourceName,
            status: source.status,
            createdAt: source.createdAt.toISOString(),
          }))}
          items={business.businessMemoryItems.map((item) => ({
            id: item.id,
            category: item.category,
            title: item.title,
            content: item.content,
            status: item.status,
            confidence: item.confidence,
            sourceType: item.sourceType,
            sourceName: item.sourceName,
            createdAt: item.createdAt.toISOString(),
          }))}
          compliance={compliance}
        />
      </section>
    </SettingsShell>
  )
}
