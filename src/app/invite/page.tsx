import type { Metadata } from "next"
import Link from "next/link"
import { InviteCodeForm } from "./InviteCodeForm"

export const metadata: Metadata = {
  title: "Accept Team Invite",
  description: "Accept a LeadReply team invitation with a secure invite code.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function InviteCodePage() {
  return (
    <main className="min-h-screen bg-lr-page px-4 py-10">
      <div className="mx-auto max-w-xl rounded-2xl border border-lr-border bg-lr-surface p-6 shadow-sm sm:p-8">
        <Link
          href="/"
          className="text-sm font-black uppercase tracking-wide text-emerald-700"
        >
          LeadReply
        </Link>

        <section className="mt-8">
          <p className="text-sm font-bold uppercase tracking-wide text-lr-subtle">
            Team invitation
          </p>
          <h1 className="mt-2 text-3xl font-black text-lr-strong">
            Join with an invite code
          </h1>
          <p className="mt-3 text-sm leading-6 text-lr-muted">
            Enter the email address the owner invited, the 6-digit code they
            gave you, and your password. Invite codes expire and can only be
            used once.
          </p>

          <InviteCodeForm />
        </section>
      </div>
    </main>
  )
}
