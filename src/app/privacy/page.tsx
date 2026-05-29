import type { Metadata } from "next"
import Link from "next/link"
import { noIndexRobots } from "@/lib/site"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "LeadReply privacy policy placeholder.",
  robots: noIndexRobots,
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/login" className="text-sm font-semibold text-slate-600">
          Back to sign in
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-slate-950">
          Privacy Policy
        </h1>
        <p className="mt-4 text-slate-600">
          This page is a placeholder until the final privacy policy is reviewed
          and approved before launch.
        </p>
      </div>
    </main>
  )
}
