import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "SEO",
  description:
    "Set up LeadReply local SEO, digital presence, website audits, and search growth work.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function SeoPage() {
  redirect("/growth")
}
