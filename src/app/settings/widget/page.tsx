import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { AppNav } from "../../components/AppNav"
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

  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
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
    <main className="min-h-screen bg-slate-50 px-4 py-6 pb-28 sm:px-6 sm:py-8 md:pb-8">
      <div className="mx-auto max-w-5xl">
        <AppNav />

        <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            Back to dashboard
          </Link>

          <div className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">
              Website widget
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Text us and callback widget
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Add a simple contact widget to a client website so visitors can
              request help without calling.
            </p>
          </div>

          <WidgetSettingsForm
            business={business}
            widgetUrl={widgetUrl}
            scriptUrl={scriptUrl}
          />
        </section>
      </div>
    </main>
  )
}
