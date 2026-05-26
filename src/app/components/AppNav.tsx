"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/missed-calls", label: "Inbox" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings/business", label: "Settings" },
  { href: "/settings/billing", label: "Billing" },
]

function isActiveLink(pathname: string, href: string) {
  if (href === "/settings/business") {
    return pathname.startsWith("/settings") && pathname !== "/settings/billing"
  }

  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
}

export function AppNav() {
  const pathname = usePathname()

  return (
    <>
      <nav className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm">
        <Link href="/dashboard" className="text-lg font-bold text-slate-950">
          LeadReply
        </Link>

        <div className="hidden flex-wrap items-center gap-2 text-sm font-medium md:flex">
          {navLinks.map((link) => {
            const active = isActiveLink(pathname, link.href)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
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
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Log out
        </button>
      </nav>

      <nav className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg md:hidden">
        <div className="grid grid-cols-5 gap-1 text-center text-xs font-semibold">
          {navLinks.slice(0, 5).map((link) => {
            const active =
              link.href === "/settings/business"
                ? pathname.startsWith("/settings")
                : isActiveLink(pathname, link.href)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-2 py-3 ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
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
