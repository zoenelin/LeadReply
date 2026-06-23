import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { SettingsShell } from "@/components/SettingsShell"
import { prisma } from "@/lib/data/prisma"
import { AppearanceSettingsForm } from "./AppearanceSettingsForm"

export const metadata: Metadata = {
  title: "Appearance",
  description: "Choose light or dark appearance for LeadReply.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AppearanceSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      themePreference: true,
    },
  })

  if (!user) {
    redirect("/login")
  }

  return (
    <SettingsShell>
      <section className="space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Appearance
          </p>
          <h1 className="mt-2 text-3xl font-bold text-lr-strong">
            Light and dark mode
          </h1>
          <p className="mt-3 max-w-2xl text-lr-muted">
            Choose how LeadReply looks for this account. This setting is saved
            for your login and applies across the app.
          </p>
        </div>

        <AppearanceSettingsForm initialPreference={user.themePreference} />
      </section>
    </SettingsShell>
  )
}
