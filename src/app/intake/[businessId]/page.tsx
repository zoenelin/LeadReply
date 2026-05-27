import { notFound } from "next/navigation"
import { businessCategoryLabels } from "@/lib/business-options"
import { prisma } from "@/lib/prisma"
import { LeadIntakeForm } from "./LeadIntakeForm"

type LeadIntakePageProps = {
  params: Promise<{
    businessId: string
  }>
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
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            LeadReply
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">
            Contact {business.name}
          </h1>
          <p className="mt-3 text-slate-600">
            Send a quick request and the team will follow up with the next
            step.
          </p>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-950">{business.name}</p>
            <p className="mt-1 text-sm text-slate-600">{business.phone}</p>
            {(business.city || business.state) && (
              <p className="mt-1 text-sm text-slate-600">
                {business.city}
                {business.city && business.state ? ", " : ""}
                {business.state} {business.zip}
              </p>
            )}
            <p className="mt-3 w-fit rounded-lg bg-white px-3 py-1 text-sm font-medium text-slate-700">
              {businessCategoryLabels[business.businessType] ?? "Business"}
            </p>
          </div>

          <LeadIntakeForm businessId={business.id} />
        </div>
      </div>
    </main>
  )
}
