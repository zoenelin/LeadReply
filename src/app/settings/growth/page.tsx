import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Growth Redirect",
  description: "Redirects legacy growth settings links to Growth.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function LegacyGrowthSettingsPage() {
  redirect("/growth")
}
