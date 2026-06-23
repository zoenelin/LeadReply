import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Marketing",
  description:
    "Plan LeadReply marketing, campaigns, content, and customer growth work.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function MarketingPage() {
  redirect("/growth")
}
