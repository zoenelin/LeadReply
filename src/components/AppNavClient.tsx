"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { signOut } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import type { BusinessCapability } from "@/lib/security/permissions"

type ModuleLink = {
  href: string
  label: string
  requiredCapabilities?: BusinessCapability[]
  active: (pathname: string, module: string | null) => boolean
}

const moduleLinks: ModuleLink[] = [
  {
    href: "/dashboard",
    label: "Snapshot",
    requiredCapabilities: ["viewAnalytics"],
    active: (pathname) =>
      pathname === "/dashboard" ||
      pathname === "/snapshot" ||
      pathname === "/owner" ||
      pathname === "/notifications",
  },
  {
    href: "/leads",
    label: "Customers/Jobs",
    requiredCapabilities: ["manageLeads"],
    active: (pathname) =>
      pathname.startsWith("/leads") ||
      pathname.startsWith("/settings/services") ||
      pathname.startsWith("/settings/calendar"),
  },
  {
    href: "/missed-calls",
    label: "Inbox",
    requiredCapabilities: ["manageMessages"],
    active: (pathname) => pathname.startsWith("/missed-calls"),
  },
  {
    href: "/reviews",
    label: "Reviews",
    requiredCapabilities: ["manageReviews"],
    active: (pathname) => pathname.startsWith("/reviews"),
  },
  {
    href: "/growth",
    label: "Growth",
    requiredCapabilities: ["manageSeo", "requestGrowthServices"],
    active: (pathname) =>
      pathname.startsWith("/growth") ||
      pathname.startsWith("/marketing") ||
      pathname.startsWith("/seo"),
  },
  {
    href: "/settings/business",
    label: "Settings",
    requiredCapabilities: ["viewSettings"],
    active: (pathname) =>
      pathname.startsWith("/settings") &&
      !pathname.startsWith("/settings/services") &&
      !pathname.startsWith("/settings/calendar"),
  },
]

type AppNavClientProps = {
  capabilities?: BusinessCapability[] | null
  notificationCount?: number
  highPriorityNotificationCount?: number
}

function linkIsVisible(
  link: ModuleLink,
  capabilities?: BusinessCapability[] | null
) {
  if (!capabilities) {
    return true
  }

  if (!link.requiredCapabilities?.length) {
    return true
  }

  return link.requiredCapabilities.some((capability) =>
    capabilities.includes(capability)
  )
}

export function AppNavClient({
  capabilities,
  notificationCount = 0,
  highPriorityNotificationCount = 0,
}: AppNavClientProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedModule = searchParams.get("module")
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuContentRef = useRef<HTMLDivElement>(null)
  const visibleLinks = moduleLinks.filter((link) =>
    linkIsVisible(link, capabilities)
  )

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    function closeOnOutsideClick(event: PointerEvent) {
      const target = event.target

      if (!(target instanceof Node)) {
        return
      }

      if (
        menuButtonRef.current?.contains(target) ||
        menuContentRef.current?.contains(target)
      ) {
        return
      }

      setMenuOpen(false)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false)
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick)
    document.addEventListener("keydown", closeOnEscape)

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [menuOpen])

  return (
    <>
      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onPointerDown={() => setMenuOpen(false)}
          className="fixed inset-x-0 bottom-0 top-14 z-40 cursor-default bg-transparent sm:top-16"
        />
      )}

      <div className="fixed inset-x-0 top-0 z-50 border-b border-lr-border bg-lr-surface/95 shadow-lg shadow-lr-shadow/30 backdrop-blur">
        <nav
          aria-label="Primary"
          className="mx-auto flex max-w-[1600px] items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 lg:px-6"
        >
          <Link
            href="/dashboard"
            className="flex min-w-fit items-center gap-2 rounded-xl text-lr-strong"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lr-primary text-xs font-black text-lr-on-primary shadow-sm ring-1 ring-lr-sky/25 sm:h-9 sm:w-9 sm:text-sm">
              LR
            </span>
            <span className="hidden text-base font-bold min-[440px]:inline sm:text-lg">
              LeadReply
            </span>
          </Link>

          <div className="flex-1" aria-hidden="true" />

          <Link
            href="/notifications"
            aria-label={`${notificationCount} notifications`}
            className="relative inline-flex h-9 w-9 min-w-fit items-center justify-center rounded-lg border border-lr-border-strong bg-lr-surface-muted text-sm font-black text-lr-body transition hover:border-lr-primary hover:bg-lr-hover hover:text-lr-strong sm:h-10 sm:w-10"
          >
            <span aria-hidden="true">!</span>
            {notificationCount > 0 && (
              <span
                className={`absolute -right-1 -top-1 min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-black leading-none text-white ${
                  highPriorityNotificationCount > 0
                    ? "bg-red-600"
                    : "bg-lr-primary"
                }`}
              >
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            ref={menuButtonRef}
            aria-expanded={menuOpen}
            aria-controls="primary-menu"
            onClick={() => setMenuOpen((isOpen) => !isOpen)}
            className="inline-flex min-w-fit items-center gap-2 rounded-lg border border-lr-border-strong bg-lr-surface-muted px-2.5 py-2 text-xs font-semibold text-lr-body transition hover:border-lr-primary hover:bg-lr-hover hover:text-lr-strong sm:px-3 sm:text-sm"
          >
            <span className="grid gap-0.5" aria-hidden="true">
              <span className="block h-0.5 w-3.5 rounded-full bg-current" />
              <span className="block h-0.5 w-3.5 rounded-full bg-current" />
              <span className="block h-0.5 w-3.5 rounded-full bg-current" />
            </span>
            Menu
          </button>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="min-w-fit rounded-lg border border-lr-border-strong bg-lr-surface-muted px-2.5 py-2 text-xs font-semibold text-lr-body transition hover:border-lr-primary hover:bg-lr-hover hover:text-lr-strong sm:px-3 sm:text-sm"
          >
            Log out
          </button>

          {menuOpen && (
            <div
              id="primary-menu"
              className="absolute inset-x-0 top-full border-b border-lr-border bg-lr-surface px-3 py-3 shadow-lg shadow-lr-shadow/30"
            >
              <div
                ref={menuContentRef}
                className="mx-auto grid max-w-[1600px] gap-1 sm:grid-cols-4 lg:grid-cols-7"
              >
                {visibleLinks.map((link) => {
                  const active = link.active(pathname, selectedModule)

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        active
                          ? "border-lr-primary bg-lr-primary text-lr-on-primary shadow-sm"
                          : "border-transparent text-lr-body hover:border-lr-border hover:bg-lr-hover hover:text-lr-strong"
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </nav>
      </div>

      <div className="h-14 sm:h-16" aria-hidden="true" />
    </>
  )
}
