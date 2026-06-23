import type { Metadata } from "next"
import { noIndexRobots } from "@/lib/config/site"

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a LeadReply account and set up a local business CRM.",
  robots: noIndexRobots,
}

export default function SignupLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
