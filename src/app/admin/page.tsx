import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { notFound, redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { AppNav } from "@/components/AppNav"
import { AdminOperationsDashboard } from "@/features/admin/AdminOperationsDashboard"
import { isAdminEmail } from "@/lib/security/admin"
import { getAdminOperationsDashboard } from "@/services/admin/operations"

export const metadata: Metadata = {
  title: "Admin Operations",
  description:
    "Internal LeadReply operations portal for clients, workers, AI usage, integrations, and launch work.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (!isAdminEmail(session.user.email)) {
    notFound()
  }

  const data = await getAdminOperationsDashboard()

  return (
    <main className="min-h-screen bg-lr-page px-4 py-6 pb-10 sm:px-6 sm:py-8 md:pb-8">
      <div className="mx-auto max-w-[1600px]">
        <AppNav />
        <AdminOperationsDashboard data={data} />
      </div>
    </main>
  )
}
