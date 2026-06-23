"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { BusinessCapability } from "@/lib/security/permissions"

const settingsGroups = [
  {
    label: "Account",
    items: [
      {
        href: "/settings/business",
        label: "Business profile",
        description: "Company details and reply template",
        capability: "manageBusinessProfile",
      },
      {
        href: "/settings/security",
        label: "Password & security",
        description: "Change your login password",
        capability: "viewSettings",
      },
      {
        href: "/settings/appearance",
        label: "Appearance",
        description: "Light or dark mode",
        capability: "viewSettings",
      },
      {
        href: "/settings/billing",
        label: "Billing",
        description: "Plan and payment setup",
        capability: "manageBilling",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        href: "/settings/automation",
        label: "Automation",
        description: "Calls, quotes, booking, and reviews",
        capability: "manageAutomation",
      },
      {
        href: "/settings/memory",
        label: "Business memory",
        description: "Approved facts from sites, files, and APIs",
        capability: "manageAutomation",
      },
      {
        href: "/settings/phone-lines",
        label: "Phone lines",
        description: "Numbers and routing targets",
        capability: "managePhoneLines",
      },
      {
        href: "/settings/services",
        label: "Services",
        description: "Service catalog and availability",
        capability: "manageLeads",
      },
      {
        href: "/settings/calendar",
        label: "Calendar",
        description: "Booking provider and links",
        capability: "manageAppointments",
      },
      {
        href: "/settings/widget",
        label: "Website widget",
        description: "Callback and text capture widget",
        capability: "manageAutomation",
      },
      {
        href: "/settings/team",
        label: "Team",
        description: "Staff and permissions",
        capability: "manageTeam",
      },
    ],
  },
  {
    label: "Launch",
    items: [
      {
        href: "/settings/launch",
        label: "Launch readiness",
        description: "Provider and launch checklist",
        capability: "manageBusinessProfile",
      },
    ],
  },
]

type SettingsSideNavProps = {
  capabilities?: BusinessCapability[]
}

export function SettingsSideNav({ capabilities = [] }: SettingsSideNavProps) {
  const pathname = usePathname()
  const visibleGroups = settingsGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        capabilities.includes(item.capability as BusinessCapability)
      ),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <aside className="bg-lr-surface-muted/70 p-4 lg:sticky lg:top-16 lg:min-h-[calc(100vh-5rem)] lg:p-5">
      <div className="px-2 py-2">
        <p className="text-2xl font-black tracking-tight text-lr-strong">
          Settings
        </p>
        <p className="mt-2 text-sm leading-6 text-lr-muted">
          Account, setup, billing, and launch controls.
        </p>
      </div>

      <div className="mt-6 space-y-6">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p className="px-2 text-[11px] font-black uppercase tracking-wide text-lr-subtle">
              {group.label}
            </p>
            <div className="mt-2 space-y-1">
              {group.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                      active
                        ? "border-lr-primary bg-lr-primary text-lr-on-primary shadow-sm"
                        : "border-transparent text-lr-body hover:border-lr-border hover:bg-lr-surface hover:text-lr-strong"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-2.5 w-2.5 rounded-full ${
                        active
                          ? "bg-lr-on-primary"
                          : "bg-lr-border-strong group-hover:bg-lr-muted"
                      }`}
                    />
                    <span className="min-w-0 text-sm font-bold">
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
