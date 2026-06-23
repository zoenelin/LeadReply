"use client"

import Link from "next/link"
import { useState } from "react"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function requestReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/password-reset/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage(data.message)
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-lr-page px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-md rounded-2xl border border-lr-border bg-lr-surface p-6 shadow-sm sm:p-8">
        <Link
          href="/login"
          className="text-sm font-semibold text-lr-muted hover:text-lr-strong"
        >
          Back to login
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-lr-strong">
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-lr-muted">
          Enter your account email and LeadReply will send a secure reset link.
        </p>

        <form onSubmit={requestReset} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="you@example.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-lr-primary px-4 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-lr-muted" aria-live="polite">
            {message}
          </p>
        )}
      </div>
    </main>
  )
}
