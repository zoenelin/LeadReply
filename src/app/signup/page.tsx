"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { businessCategories, planOptions } from "@/lib/business-options"

const steps = ["Account", "Business", "Category", "Plan", "Confirm"]

const states = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
]

export default function SignupPage() {
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [businessPhone, setBusinessPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zip, setZip] = useState("")
  const [businessType, setBusinessType] = useState("AUTOMOTIVE")
  const [selectedPlan, setSelectedPlan] = useState("BASIC")
  const [bookingNotes, setBookingNotes] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const selectedCategoryLabel = useMemo(
    () =>
      businessCategories
        .flatMap((group) => group.options)
        .find((category) => category.value === businessType)?.label ??
      "Business",
    [businessType]
  )
  const selectedPlanLabel =
    planOptions.find((plan) => plan.value === selectedPlan)?.label ?? "Basic"

  function validateStep() {
    if (step === 0) {
      return email.length > 0 && password.length >= 8
    }
    if (step === 1) {
      return (
        businessName.length > 0 &&
        businessPhone.length > 0 &&
        address.length > 0 &&
        city.length > 0 &&
        state.length > 0 &&
        zip.length > 0
      )
    }
    return true
  }

  function goNext() {
    setMessage("")
    if (!validateStep()) {
      setMessage("Please complete the required fields before continuing.")
      return
    }
    setStep((currentStep) => Math.min(currentStep + 1, steps.length - 1))
  }

  async function handleSignup() {
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          businessName,
          businessPhone,
          website,
          address,
          city,
          state,
          zip,
          businessType,
          selectedPlan,
          bookingNotes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
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
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-5 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-slate-500">LeadReply setup</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Create your account
        </h1>
        <p className="mt-3 text-slate-600">
          We will keep this simple and use your answers to tailor the dashboard.
        </p>

        <div className="mt-8 grid gap-2 sm:grid-cols-5">
          {steps.map((label, index) => (
            <div
              key={label}
              className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                index === step
                  ? "border-slate-950 bg-slate-950 text-white"
                  : index < step
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              {index + 1}. {label}
            </div>
          ))}
        </div>

        <div className="mt-8">
          {step === 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Account details</h2>
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
                <label className="mb-1 block text-sm font-medium">
                  Password
                </label>
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
                  Must be at least 8 characters and include a letter and number.
                </p>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Business basics</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Business name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                    placeholder="Main Street Auto"
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
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Website
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Street address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  placeholder="123 Main Street"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_120px_140px]">
                <div>
                  <label className="mb-1 block text-sm font-medium">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    State
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
                    required
                  >
                    <option value="">Select</option>
                    {states.map((stateOption) => (
                      <option key={stateOption} value={stateOption}>
                        {stateOption}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">ZIP</label>
                  <input
                    type="text"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                    required
                  />
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Business category</h2>
              <p className="text-slate-600">
                Choose the closest fit. This controls dashboard language and
                setup recommendations.
              </p>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
              >
                {businessCategories.map((group) => (
                  <optgroup key={group.group} label={group.group}>
                    {group.options.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Booking or reservation notes
                </label>
                <textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  placeholder="Example: We take dinner reservations, appointment requests, or service estimates."
                />
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Choose a plan</h2>
              <p className="text-slate-600">
                Pricing is coming soon. Pick the package that best matches what
                you want LeadReply to help with.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                {planOptions.map((plan) => (
                  <button
                    key={plan.value}
                    type="button"
                    onClick={() => setSelectedPlan(plan.value)}
                    className={`rounded-2xl border p-5 text-left ${
                      selectedPlan === plan.value
                        ? "border-slate-950 bg-slate-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-lg font-bold text-slate-950">
                      {plan.label}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {plan.tagline}
                    </p>
                    <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                      Pricing coming soon
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-700">
                      {plan.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Confirm setup</h2>
              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Account</p>
                  <p className="mt-1 font-semibold">{email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Business</p>
                  <p className="mt-1 font-semibold">{businessName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Location</p>
                  <p className="mt-1 font-semibold">
                    {city}, {state} {zip}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Category</p>
                  <p className="mt-1 font-semibold">{selectedCategoryLabel}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Plan</p>
                  <p className="mt-1 font-semibold">{selectedPlanLabel}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="mt-1 font-semibold">{businessPhone}</p>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => {
              setMessage("")
              setStep((currentStep) => Math.max(currentStep - 1, 0))
            }}
            disabled={step === 0 || loading}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSignup}
              disabled={loading}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          )}
        </div>

        {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
      </div>
    </main>
  )
}
