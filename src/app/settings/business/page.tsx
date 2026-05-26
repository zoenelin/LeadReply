import Link from "next/link"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { AppNav } from "../../components/AppNav"
import { BusinessSettingsForm } from "./BusinessSettingsForm"

export default async function BusinessSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
    },
  })

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <AppNav />
      </div>

      <div className="mx-auto mt-8 max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          Back to dashboard
        </Link>

        <h1 className="mt-6 text-3xl font-bold">Business settings</h1>
        <p className="mt-3 text-slate-600">
          Update the details LeadReply uses to tailor your dashboard and future
          replies.
        </p>

        <BusinessSettingsForm
          initialBusiness={{
            name: business?.name ?? "",
            phone: business?.phone ?? "",
            businessType: business?.businessType ?? "HOME_SERVICES",
            replyTemplate: business?.replyTemplate ?? "",
          }}
        />
      </div>
    </main>
  )
}
