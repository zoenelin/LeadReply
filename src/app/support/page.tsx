import type { Metadata } from "next"
import Link from "next/link"
import { getSupportEmail } from "@/lib/integrations/email"
import { noIndexRobots } from "@/lib/config/site"

export const metadata: Metadata = {
  title: "Support",
  description: "Get help signing in to LeadReply.",
  robots: noIndexRobots,
}

export default function SupportPage() {
  const supportEmail = getSupportEmail() || "support@example.com"

  return (
    <main className="min-h-screen bg-lr-page px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-lr-border bg-lr-surface p-6 shadow-sm sm:p-8">
        <Link href="/login" className="text-sm font-semibold text-lr-muted">
          Back to sign in
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-lr-strong">
          Help Center
        </h1>
        <p className="mt-4 text-lr-muted">
          For sign-in help, password reset problems, or account questions,
          contact support at{" "}
          <a className="font-semibold underline" href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>
          .
        </p>
      </div>
    </main>
  )
}
