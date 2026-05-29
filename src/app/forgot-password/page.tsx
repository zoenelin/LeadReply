import type { Metadata } from "next"
import { noIndexRobots } from "@/lib/site"
import { ForgotPasswordForm } from "./ForgotPasswordForm"

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a secure LeadReply password reset link.",
  robots: noIndexRobots,
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
