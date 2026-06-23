import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/data/prisma"
import { SettingsShell } from "@/components/SettingsShell"
import { getBusinessAccessForSession } from "@/services/auth/business-access"
import { WidgetSettingsForm } from "./WidgetSettingsForm"

export const metadata: Metadata = {
  title: "Website Widget",
  description: "Configure the LeadReply callback and text widget for a business website.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function WidgetSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const access = await getBusinessAccessForSession(session, "manageAutomation")

  if (!access) {
    redirect("/dashboard")
  }

  const business = await prisma.business.findUnique({
    where: {
      id: access.businessId,
    },
    select: {
      id: true,
      name: true,
      widgetGreeting: true,
      widgetPrimaryAction: true,
      widgetAccentColor: true,
    },
  })

  if (!business) {
    redirect("/settings/business")
  }

  const headerStore = await headers()
  const host = headerStore.get("host") ?? "localhost:3000"
  const protocol = host.includes("localhost") ? "http" : "https"
  const widgetUrl = `${protocol}://${host}/widget/${business.id}`
  const scriptUrl = `${protocol}://${host}/widget.js`

  return (
    <SettingsShell>
      <section className="space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">
            Website widget
          </p>
          <h1 className="mt-2 text-3xl font-bold text-lr-strong">
            Text us and callback widget
          </h1>
          <p className="mt-3 max-w-2xl text-lr-muted">
            Add a simple contact widget to a client website so visitors can
            request a callback or text follow-up. It creates leads now, while AI
            chat, live scheduling, and deeper website automation remain future
            integration steps.
          </p>
        </div>

        <WidgetSettingsForm
          business={business}
          widgetUrl={widgetUrl}
          scriptUrl={scriptUrl}
        />
      </section>
    </SettingsShell>
  )
}
