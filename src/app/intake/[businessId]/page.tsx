import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/data/prisma"
import { absoluteUrl, noIndexRobots } from "@/lib/config/site"
import { LeadIntakeForm } from "@/features/core/LeadIntakeForm"

type LeadIntakePageProps = {
  params: Promise<{
    businessId: string
  }>
}

export async function generateMetadata({
  params,
}: LeadIntakePageProps): Promise<Metadata> {
  const { businessId } = await params
  const business = await prisma.business.findUnique({
    where: {
      id: businessId,
    },
    select: {
      name: true,
    },
  })

  return {
    title: business ? `Contact ${business.name}` : "Contact Business",
    description: business
      ? `Send a request to ${business.name} through LeadReply.`
      : "Send a request through LeadReply.",
    alternates: {
      canonical: absoluteUrl(`/intake/${businessId}`),
    },
    robots: noIndexRobots,
  }
}

export default async function LeadIntakePage({ params }: LeadIntakePageProps) {
  const { businessId } = await params
  const business = await prisma.business.findUnique({
    where: {
      id: businessId,
    },
  })

  if (!business) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-lr-page px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-lr-surface p-5 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            LeadReply
          </p>
          <h1 className="mt-3 text-3xl font-bold text-lr-strong">
            Contact {business.name}
          </h1>
          <p className="mt-3 text-lr-muted">
            Send a quick request and the team will follow up with the next
            step.
          </p>
          <div className="mt-5 rounded-2xl border border-lr-border bg-lr-surface-muted p-4">
            <p className="font-semibold text-lr-strong">{business.name}</p>
            <p className="mt-1 text-sm text-lr-muted">{business.phone}</p>
            {(business.city || business.state) && (
              <p className="mt-1 text-sm text-lr-muted">
                {business.city}
                {business.city && business.state ? ", " : ""}
                {business.state} {business.zip}
              </p>
            )}
          </div>

          <LeadIntakeForm businessId={business.id} />
        </div>
      </div>
    </main>
  )
}
