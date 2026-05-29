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
    <main className="flex min-h-screen flex-col bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-md flex-1">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <Link href="/" className="text-lg font-bold text-slate-950">
              LeadReply
            </Link>
            <h1 className="mt-5 text-2xl font-bold text-slate-950">
              Sign in
            </h1>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Email address
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-3">
              <label className="block text-xs font-medium text-slate-600">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-950"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="Your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

          <p className="mt-4 text-center text-xs leading-5 text-slate-500">
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

          <div className="mt-7 flex items-center justify-between gap-4 text-xs font-semibold text-slate-600">
            <Link href="/support" className="hover:text-slate-950">
              Other issue with sign in
            </Link>
            <Link href="/forgot-password" className="hover:text-slate-950">
              Forgot your password?
            </Link>
          </div>

        {message && (
          <p className="mt-4 text-sm text-slate-600" aria-live="polite">
            {message}
          </p>
        )}
        </section>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <p className="text-sm font-medium text-slate-500">
            New to LeadReply?
          </p>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <Link
          href="/signup"
          className="flex w-full items-center justify-center rounded-full border border-slate-900 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
        >
          Create an account
        </Link>
      </div>

      <footer className="mx-auto mt-10 flex flex-wrap justify-center gap-5 text-xs text-slate-500">
        <Link href="/support" className="hover:text-slate-900">
          Help Center
        </Link>
        <Link href="/terms" className="hover:text-slate-900">
          Terms of Service
        </Link>
        <Link href="/privacy" className="hover:text-slate-900">
          Privacy Policy
        </Link>
        <span>2026 LeadReply</span>
      </footer>
    </main>
  )
}
