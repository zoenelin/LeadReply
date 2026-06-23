"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  passwordHelpText,
  passwordMaxLength,
  passwordMinLength,
} from "@/lib/security/password-policy"

type ResetPasswordFormProps = {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function resetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/password-reset/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage(data.message)
      setTimeout(() => {
        router.push("/login")
      }, 900)
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
          Create a new password
        </h1>
        <p className="mt-2 text-sm text-lr-muted">{passwordHelpText}</p>

        {!token ? (
          <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This reset link is missing a token. Request a new link to continue.
          </p>
        ) : (
          <form onSubmit={resetPassword} className="mt-6 space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium">
                  New password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="text-sm font-semibold text-lr-muted hover:text-lr-strong"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
                required
                minLength={passwordMinLength}
                maxLength={passwordMaxLength}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-lr-primary px-4 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}

        {message && (
          <p className="mt-4 text-sm text-lr-muted" aria-live="polite">
            {message}
          </p>
        )}
      </div>
    </main>
  )
}
