"use client"

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

type InviteAcceptFormProps = {
  token: string
  email: string
}

export function InviteAcceptForm({ token, email }: InviteAcceptFormProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const canSubmit = password.length >= 8 && !loading

  async function acceptInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/team-invitations/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          name,
          password,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Could not accept this invite.")
        return
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        setMessage("Invite accepted. Please sign in with your password.")
        router.push("/login")
        router.refresh()
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setMessage("Could not accept this invite right now.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={acceptInvite} className="mt-6 space-y-4">
      <label className="block text-sm font-bold text-lr-body">
        Your name
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          className="mt-2 w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 text-sm outline-none focus:border-lr-strong"
          placeholder="Jane Manager"
        />
      </label>

      <label className="block text-sm font-bold text-lr-body">
        Email
        <input
          type="email"
          value={email}
          disabled
          className="mt-2 w-full rounded-xl border border-lr-border bg-lr-surface-muted px-4 py-3 text-sm text-lr-muted"
        />
      </label>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="block text-sm font-bold text-lr-body">
            Password
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="text-xs font-bold text-lr-muted hover:text-lr-strong"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 text-sm outline-none focus:border-lr-strong"
          placeholder="Use 8 to 72 characters"
          required
        />
        <p className="mt-2 text-xs font-medium text-lr-subtle">
          If this email already has a LeadReply account, enter that account
          password to link the invite.
        </p>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-xl bg-lr-primary px-5 py-3 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Accepting..." : "Accept invite"}
      </button>

      {message && (
        <p className="rounded-xl bg-lr-surface-muted px-4 py-3 text-sm font-semibold text-lr-muted">
          {message}
        </p>
      )}
    </form>
  )
}
