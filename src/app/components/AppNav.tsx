"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/snapshot", label: "Snapshot" },
  { href: "/notifications", label: "Alerts" },
  { href: "/leads", label: "Leads" },
  { href: "/missed-calls", label: "Inbox" },
  { href: "/settings/services", label: "Services" },
  { href: "/settings/calendar", label: "Calendar" },
  { href: "/settings/team", label: "Team" },
  { href: "/analytics", label: "Analytics" },
  { href: "/reviews", label: "Reviews" },
  { href: "/settings/business", label: "Settings" },
  { href: "/settings/launch", label: "Launch" },
  { href: "/settings/billing", label: "Billing" },
]

const mobileNavLinks = [
  { href: "/snapshot", label: "Snapshot" },
  { href: "/notifications", label: "Alerts" },
  { href: "/leads", label: "Leads" },
  { href: "/missed-calls", label: "Inbox" },
  { href: "/analytics", label: "Stats" },
  { href: "/settings/business", label: "Settings" },
]

function isActiveLink(pathname: string, href: string) {
  if (href === "/settings/business") {
    return (
      pathname === "/settings/business" ||
      pathname === "/settings/automation" ||
      pathname === "/settings/widget"
    )
  }

  if (href === "/settings/launch") {
    return pathname === "/settings/launch"
  }

  if (href === "/settings/services") {
    return pathname.startsWith("/settings/services")
  }

  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
}

export function AppNav() {
  const pathname = usePathname()

  return (
    <>
      <nav className="flex items-center justify-between gap-4 rounded-2xl border border-white/70 bg-white/95 p-3 shadow-sm shadow-slate-200/70 backdrop-blur">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-xl px-1 py-1 text-slate-950"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white shadow-sm">
            LR
          </span>
          <span className="hidden text-lg font-bold sm:inline">
            LeadReply
          </span>
        </Link>

        <div className="hidden flex-wrap items-center justify-center gap-1 text-sm font-medium md:flex">
          {navLinks.map((link) => {
            const active = isActiveLink(pathname, link.href)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3 py-2 transition ${
                  active
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
        >
          Log out
        </button>
      </nav>

      <nav className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg shadow-slate-300/40 backdrop-blur md:hidden">
        <div className="grid grid-cols-6 gap-1 text-center text-[11px] font-semibold">
          {mobileNavLinks.map((link) => {
            const active =
              link.href === "/settings/business"
                ? pathname.startsWith("/settings")
                : isActiveLink(pathname, link.href)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-2 py-3 transition ${
                  active
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
