"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"

export function AppNav() {
  return (
    <nav className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <Link href="/dashboard" className="text-lg font-bold text-slate-950">
        LeadReply
      </Link>

      <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
        <Link
          href="/dashboard"
          className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
        >
          Dashboard
        </Link>
        <Link
          href="/missed-calls"
          className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
        >
          Inbox
        </Link>
        <Link
          href="/settings/business"
          className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
        >
          Settings
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50"
        >
          Log out
        </button>
      </div>
    </nav>
  )
}
