import type { Metadata } from "next"
import { noIndexRobots } from "@/lib/site"

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to your LeadReply CRM dashboard.",
  robots: noIndexRobots,
}

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
