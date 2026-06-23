"use client"

import { useState } from "react"
import {
  passwordHelpText,
  passwordMaxLength,
  passwordMinLength,
} from "@/lib/security/password-policy"

export function PasswordSettingsForm() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")

    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Password could not be updated.")
        return
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setMessage(data.message || "Password updated.")
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div className="rounded-2xl border border-lr-border bg-lr-surface-muted p-4">
        <p className="text-sm font-bold text-lr-strong">Password standard</p>
        <p className="mt-1 text-sm leading-6 text-lr-muted">
          {passwordHelpText}
        </p>
      </div>

      <label className="block text-sm font-medium text-lr-body">
        Current password
        <input
          type={showPasswords ? "text" : "password"}
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="mt-2 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none transition focus:border-lr-strong"
          required
        />
      </label>

      <label className="block text-sm font-medium text-lr-body">
        New password
        <input
          type={showPasswords ? "text" : "password"}
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          minLength={passwordMinLength}
          maxLength={passwordMaxLength}
          className="mt-2 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none transition focus:border-lr-strong"
          required
        />
      </label>

      <label className="block text-sm font-medium text-lr-body">
        Confirm new password
        <input
          type={showPasswords ? "text" : "password"}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={passwordMinLength}
          maxLength={passwordMaxLength}
          className="mt-2 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none transition focus:border-lr-strong"
          required
        />
      </label>

      <label className="flex items-center gap-3 rounded-xl bg-lr-surface-muted px-4 py-3 text-sm font-semibold text-lr-body">
        <input
          type="checkbox"
          checked={showPasswords}
          onChange={(event) => setShowPasswords(event.target.checked)}
          className="h-4 w-4 rounded border-lr-border-strong"
        />
        Show passwords
      </label>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-lr-primary px-5 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
      >
        {loading ? "Updating..." : "Update password"}
      </button>

      {message && <p className="text-sm text-lr-muted">{message}</p>}
    </form>
  )
}
