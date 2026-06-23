import type { Metadata } from "next"
import Link from "next/link"
import { noIndexRobots } from "@/lib/config/site"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "LeadReply privacy policy placeholder.",
  robots: noIndexRobots,
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-lr-page px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-lr-border bg-lr-surface p-6 shadow-sm sm:p-8">
        <Link href="/login" className="text-sm font-semibold text-lr-muted">
          Back to sign in
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-lr-strong">
          Privacy Policy
        </h1>
        <p className="mt-4 text-lr-muted">
          This page is a placeholder until the final privacy policy is reviewed
          and approved before launch.
        </p>
      </div>
    </main>
  )
}
