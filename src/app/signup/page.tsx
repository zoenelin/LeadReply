"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const businessTypes = [
  { value: "HOME_SERVICES", label: "Home services" },
  { value: "BEAUTY_SERVICES", label: "Beauty services" },
  { value: "FOOD_SERVICES", label: "Food and restaurants" },
]

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [businessPhone, setBusinessPhone] = useState("")
  const [businessType, setBusinessType] = useState("HOME_SERVICES")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          businessName,
          businessPhone,
          businessType,
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        setLoading(false)
        return
      }

      setMessage("Account created. Redirecting to login...")
      setTimeout(() => {
        router.push("/login")
      }, 1000)
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Start using LeadReply.
        </p>

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Business name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="Zoe's Salon"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Business phone
            </label>
            <input
              type="tel"
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="(555) 123-4567"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              What kind of business do you run?
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
              required
            >
              {businessTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="Create a password"
              minLength={8}
              required
            />

            <p className="mt-1 text-xs text-slate-500">
              Must be 8-72 characters and include at least one letter and one number.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-slate-600">{message}</p>
        )}
      </div>
    </main>
  )
}
