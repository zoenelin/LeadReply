import type { ReactNode } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth/auth"
import { AppNav } from "@/components/AppNav"
import { SettingsSideNav } from "@/components/SettingsSideNav"
import { roleCapabilities } from "@/lib/security/permissions"
import { getBusinessAccessForSession } from "@/services/auth/business-access"

type SettingsShellProps = {
  children: ReactNode
}

export async function SettingsShell({ children }: SettingsShellProps) {
  const session = await getServerSession(authOptions)
  const access = session
    ? await getBusinessAccessForSession(session, "viewSettings")
    : null
  const capabilities = access
    ? [
        ...new Set([
          ...roleCapabilities[access.role],
          ...access.customPermissions,
        ]),
      ]
    : []

  return (
    <main className="min-h-screen bg-lr-page px-3 py-4 pb-8 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <AppNav />

        <div className="mt-5 overflow-hidden rounded-xl border border-lr-border bg-lr-surface shadow-sm shadow-lr-shadow/20 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
          <SettingsSideNav capabilities={capabilities} />
          <div className="min-w-0 border-t border-lr-border bg-lr-surface lg:border-l lg:border-t-0">
            <div className="px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
