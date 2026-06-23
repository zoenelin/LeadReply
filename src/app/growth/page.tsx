import type { Metadata } from "next"
import { GrowthWorkspace } from "@/features/growth/GrowthWorkspace"

export const metadata: Metadata = {
  title: "Growth",
  description:
    "Request and approve LeadReply SEO and marketing work from one simple workspace.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function GrowthPage() {
  return <GrowthWorkspace focus="growth" />
}
