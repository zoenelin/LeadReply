import { env } from "@/lib/config/env"

export function getAdminEmails() {
  return (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false
  }

  return getAdminEmails().includes(email.toLowerCase())
}
