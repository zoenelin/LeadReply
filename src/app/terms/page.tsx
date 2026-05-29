import type { Metadata } from "next"
import Link from "next/link"
import { noIndexRobots } from "@/lib/site"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "LeadReply terms of service placeholder.",
  robots: noIndexRobots,
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/login" className="text-sm font-semibold text-slate-600">
          Back to sign in
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-slate-950">
          Terms of Service
        </h1>
        <p className="mt-4 text-slate-600">
          This page is a placeholder until the final legal terms are reviewed
          and approved before launch.
        </p>
      </div>
    </main>
  )
}
