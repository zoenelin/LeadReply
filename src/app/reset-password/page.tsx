import type { Metadata } from "next"
import { noIndexRobots } from "@/lib/config/site"
import { ResetPasswordForm } from "./ResetPasswordForm"

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Create a new password for a LeadReply account.",
  robots: noIndexRobots,
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams

  return <ResetPasswordForm token={params.token ?? ""} />
}
