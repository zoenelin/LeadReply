"use client"

import Link from "next/link"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setMessage("Invalid email or password.")
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <main className="flex min-h-screen flex-col bg-lr-surface-muted px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-md flex-1">
        <section className="rounded-2xl border border-lr-border bg-lr-surface p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <Link href="/" className="text-lg font-bold text-lr-strong">
              LeadReply
            </Link>
            <h1 className="mt-5 text-2xl font-bold text-lr-strong">
              Sign in
            </h1>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-lr-muted">
              Email address
            </label>
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

          <div>
            <div className="mb-1 flex items-center justify-between gap-3">
              <label className="block text-xs font-medium text-lr-muted">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="text-xs font-semibold text-lr-muted hover:text-lr-strong"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="Your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-lr-primary px-4 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover disabled:cursor-not-allowed disabled:bg-lr-hover-strong disabled:text-lr-muted"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

          <p className="mt-4 text-center text-xs leading-5 text-lr-subtle">
            By continuing, you agree to the{" "}
            <Link href="/terms" className="font-semibold underline">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-semibold underline">
              Privacy Policy
            </Link>
            .
          </p>

          <div className="mt-7 flex items-center justify-between gap-4 text-xs font-semibold text-lr-muted">
            <Link href="/support" className="hover:text-lr-strong">
              Other issue with sign in
            </Link>
            <Link href="/forgot-password" className="hover:text-lr-strong">
              Forgot your password?
            </Link>
          </div>

        {message && (
          <p className="mt-4 text-sm text-lr-muted" aria-live="polite">
            {message}
          </p>
        )}
        </section>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-lr-hover-strong" />
          <p className="text-sm font-medium text-lr-subtle">
            New to LeadReply?
          </p>
          <div className="h-px flex-1 bg-lr-hover-strong" />
        </div>

        <Link
          href="/signup"
          className="flex w-full items-center justify-center rounded-full border border-lr-strong bg-lr-surface px-5 py-3 text-sm font-semibold text-lr-strong hover:bg-lr-hover"
        >
          Create an account
        </Link>
      </div>

      <footer className="mx-auto mt-10 flex flex-wrap justify-center gap-5 text-xs text-lr-subtle">
        <Link href="/support" className="hover:text-lr-strong">
          Help Center
        </Link>
        <Link href="/terms" className="hover:text-lr-strong">
          Terms of Service
        </Link>
        <Link href="/privacy" className="hover:text-lr-strong">
          Privacy Policy
        </Link>
        <span>2026 LeadReply</span>
      </footer>
    </main>
  )
}
