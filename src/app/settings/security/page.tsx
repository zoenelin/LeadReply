import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { SettingsShell } from "@/components/SettingsShell"
import { PasswordSettingsForm } from "./PasswordSettingsForm"

export const metadata: Metadata = {
  title: "Password & Security",
  description: "Change your LeadReply account password.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function SecuritySettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <SettingsShell>
      <section className="space-y-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-lr-subtle">
          Account security
        </p>
        <h1 className="mt-2 text-3xl font-bold text-lr-strong">
          Password & security
        </h1>
        <p className="mt-3 max-w-2xl text-lr-muted">
          Change the password used to sign in to this LeadReply account.
        </p>
        <p className="mt-3 rounded-xl bg-lr-surface-muted px-4 py-3 text-sm text-lr-muted">
          Signed in as {session.user.email}
        </p>

        <PasswordSettingsForm />
      </section>
    </SettingsShell>
  )
}
