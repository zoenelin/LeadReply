import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Snapshot",
  description:
    "LeadReply snapshot for leads, money made, response speed, reviews, and source performance.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AnalyticsPage() {
  redirect("/dashboard#money-made")
}
