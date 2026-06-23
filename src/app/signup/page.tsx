"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { businessCategories, planOptions } from "@/lib/domain/business-options"
import {
  passwordHelpText,
  passwordMaxLength,
  passwordMinLength,
} from "@/lib/security/password-policy"

const steps = ["Account", "Business", "Presence", "Specialty", "Plan", "Confirm"]

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
  const [showPassword, setShowPassword] = useState(false)
  const [businessName, setBusinessName] = useState("")
  const [businessPhone, setBusinessPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [websitePresenceStatus, setWebsitePresenceStatus] =
    useState("UNKNOWN")
  const [googleBusinessProfileUrl, setGoogleBusinessProfileUrl] = useState("")
  const [googleBusinessProfileStatus, setGoogleBusinessProfileStatus] =
    useState("UNKNOWN")
  const [facebookPageUrl, setFacebookPageUrl] = useState("")
  const [facebookPageStatus, setFacebookPageStatus] = useState("UNKNOWN")
  const [instagramProfileUrl, setInstagramProfileUrl] = useState("")
  const [instagramProfileStatus, setInstagramProfileStatus] =
    useState("UNKNOWN")
  const [wantsLeadReplySetupHelp, setWantsLeadReplySetupHelp] = useState(true)
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zip, setZip] = useState("")
  const [businessType, setBusinessType] = useState("HVAC")
  const [selectedPlan, setSelectedPlan] = useState("BASIC")
  const [bookingNotes, setBookingNotes] = useState("")
  const [skippedSetupSections, setSkippedSetupSections] = useState<string[]>([])
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
      return (
        email.trim().length > 0 &&
        password.length >= passwordMinLength &&
        password.length <= passwordMaxLength
      )
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
      if (step === 0) {
        if (!email.trim()) {
          setMessage("Enter your email address before continuing.")
          return
        }

        if (
          password.length < passwordMinLength ||
          password.length > passwordMaxLength
        ) {
          setMessage(passwordHelpText)
          return
        }
      }

      if (step === 1) {
        setMessage(
          "Enter the business name, phone, address, city, state, and ZIP before continuing."
        )
        return
      }

      setMessage("Please complete the required fields before continuing.")
      return
    }
    setStep((currentStep) => Math.min(currentStep + 1, steps.length - 1))
  }

  function markSkipped(section: string) {
    setSkippedSetupSections((sections) =>
      sections.includes(section) ? sections : [...sections, section]
    )
  }

  function skipCurrentStep() {
    setMessage("")

    if (step === 2) {
      setWebsite("")
      setWebsitePresenceStatus("UNKNOWN")
      setGoogleBusinessProfileUrl("")
      setGoogleBusinessProfileStatus("UNKNOWN")
      setFacebookPageUrl("")
      setFacebookPageStatus("UNKNOWN")
      setInstagramProfileUrl("")
      setInstagramProfileStatus("UNKNOWN")
      markSkipped("DIGITAL_PRESENCE")
      setStep((currentStep) => Math.min(currentStep + 1, steps.length - 1))
      return
    }

    if (step === 3) {
      setBookingNotes("")
      markSkipped("BOOKING_DETAILS")
      setStep((currentStep) => Math.min(currentStep + 1, steps.length - 1))
    }
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
          websitePresenceStatus,
          googleBusinessProfileUrl,
          googleBusinessProfileStatus,
          facebookPageUrl,
          facebookPageStatus,
          instagramProfileUrl,
          instagramProfileStatus,
          wantsLeadReplySetupHelp,
          address,
          city,
          state,
          zip,
          businessType,
          selectedPlan,
          bookingNotes,
          skippedSetupSections,
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
    <main className="min-h-screen bg-lr-page px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-2xl bg-lr-surface p-5 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-lr-subtle">LeadReply setup</p>
        <h1 className="mt-2 text-3xl font-bold text-lr-strong">
          Create your account
        </h1>
        <p className="mt-3 text-lr-muted">
          Start with the essentials. Anything optional can be finished later
          while LeadReply keeps the CRM and missed-call assistant intake tailored to your trade.
        </p>

        <div className="mt-8 grid gap-2 sm:grid-cols-5">
          {steps.map((label, index) => (
            <div
              key={label}
              className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                index === step
                  ? "border-lr-strong bg-lr-primary text-lr-on-primary"
                  : index < step
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-lr-border bg-lr-surface text-lr-subtle"
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
                  <label className="block text-sm font-medium">Password</label>
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
                  placeholder="Create a password"
                  minLength={passwordMinLength}
                  maxLength={passwordMaxLength}
                  required
                />
                <p className="mt-1 text-xs text-lr-subtle">
                  {passwordHelpText}
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
                    className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
                    placeholder="Main Street Plumbing"
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
                    className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Website, if you have one
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
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
                  className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
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
                    className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
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
                    className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 outline-none focus:border-lr-strong"
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
                    className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
                    required
                  />
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Digital presence</h2>
              <p className="text-lr-muted">
                Optional for now. LeadReply can use this to understand what
                already exists, what needs work, and what our team may help
                improve later.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Website status
                  </label>
                  <select
                    value={websitePresenceStatus}
                    onChange={(e) => setWebsitePresenceStatus(e.target.value)}
                    className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 outline-none focus:border-lr-strong"
                  >
                    <option value="UNKNOWN">Not sure yet</option>
                    <option value="CONNECTED">Have one</option>
                    <option value="MISSING">Do not have one</option>
                    <option value="NEEDS_WORK">Have one, needs work</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Google profile URL
                  </label>
                  <input
                    type="url"
                    value={googleBusinessProfileUrl}
                    onChange={(e) =>
                      setGoogleBusinessProfileUrl(e.target.value)
                    }
                    className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
                    placeholder="https://g.page/..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Google profile status
                  </label>
                  <select
                    value={googleBusinessProfileStatus}
                    onChange={(e) =>
                      setGoogleBusinessProfileStatus(e.target.value)
                    }
                    className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 outline-none focus:border-lr-strong"
                  >
                    <option value="UNKNOWN">Not sure yet</option>
                    <option value="CONNECTED">Connected</option>
                    <option value="MISSING">Missing</option>
                    <option value="NEEDS_WORK">Needs work</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Facebook page URL
                  </label>
                  <input
                    type="url"
                    value={facebookPageUrl}
                    onChange={(e) => setFacebookPageUrl(e.target.value)}
                    className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Facebook status
                  </label>
                  <select
                    value={facebookPageStatus}
                    onChange={(e) => setFacebookPageStatus(e.target.value)}
                    className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 outline-none focus:border-lr-strong"
                  >
                    <option value="UNKNOWN">Not sure yet</option>
                    <option value="CONNECTED">Connected</option>
                    <option value="MISSING">Missing</option>
                    <option value="NEEDS_WORK">Needs work</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Instagram profile URL
                  </label>
                  <input
                    type="url"
                    value={instagramProfileUrl}
                    onChange={(e) => setInstagramProfileUrl(e.target.value)}
                    className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Instagram status
                  </label>
                  <select
                    value={instagramProfileStatus}
                    onChange={(e) =>
                      setInstagramProfileStatus(e.target.value)
                    }
                    className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 outline-none focus:border-lr-strong"
                  >
                    <option value="UNKNOWN">Not sure yet</option>
                    <option value="CONNECTED">Connected</option>
                    <option value="MISSING">Missing</option>
                    <option value="NEEDS_WORK">Needs work</option>
                  </select>
                </div>
              </div>
              <label className="flex items-start gap-3 rounded-xl bg-lr-surface-muted p-4 text-sm font-semibold text-lr-body">
                <input
                  type="checkbox"
                  checked={wantsLeadReplySetupHelp}
                  onChange={(e) =>
                    setWantsLeadReplySetupHelp(e.target.checked)
                  }
                  className="mt-1 h-4 w-4"
                />
                Track missing website or social pieces as future LeadReply setup
                services.
              </label>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Home-service specialty</h2>
              <p className="text-lr-muted">
                Choose the closest fit. This controls missed-call assistant intake questions,
                service presets, dashboard language, and setup recommendations.
              </p>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 outline-none focus:border-lr-strong"
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
                  Job, booking, or estimate notes
                </label>
                <textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="min-h-28 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
                  placeholder="Example: We handle emergency calls, estimates, maintenance visits, and owner-confirmed appointments."
                />
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Choose a plan</h2>
              <p className="text-lr-muted">
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
                        ? "border-lr-strong bg-lr-surface-muted"
                        : "border-lr-border bg-lr-surface hover:bg-lr-hover"
                    }`}
                  >
                    <p className="text-lg font-bold text-lr-strong">
                      {plan.label}
                    </p>
                    <p className="mt-2 text-sm text-lr-muted">
                      {plan.tagline}
                    </p>
                    <p className="mt-4 rounded-lg bg-lr-hover px-3 py-2 text-sm font-semibold text-lr-body">
                      Pricing coming soon
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-lr-body">
                      {plan.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 5 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Confirm setup</h2>
              <div className="grid gap-4 rounded-2xl border border-lr-border bg-lr-surface-muted p-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-lr-subtle">Account</p>
                  <p className="mt-1 font-semibold">{email}</p>
                </div>
                <div>
                  <p className="text-sm text-lr-subtle">Business</p>
                  <p className="mt-1 font-semibold">{businessName}</p>
                </div>
                <div>
                  <p className="text-sm text-lr-subtle">Location</p>
                  <p className="mt-1 font-semibold">
                    {city}, {state} {zip}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-lr-subtle">Specialty</p>
                  <p className="mt-1 font-semibold">{selectedCategoryLabel}</p>
                </div>
                <div>
                  <p className="text-sm text-lr-subtle">Plan</p>
                  <p className="mt-1 font-semibold">{selectedPlanLabel}</p>
                </div>
                <div>
                  <p className="text-sm text-lr-subtle">Phone</p>
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
            className="rounded-xl border border-lr-border-strong bg-lr-surface px-5 py-3 text-sm font-semibold text-lr-strong hover:bg-lr-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>

          {step < steps.length - 1 ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              {(step === 2 || step === 3) && (
                <button
                  type="button"
                  onClick={skipCurrentStep}
                  className="rounded-xl border border-lr-border-strong bg-lr-surface px-5 py-3 text-sm font-semibold text-lr-strong hover:bg-lr-hover"
                >
                  Skip for now
                </button>
              )}
              <button
                type="button"
                onClick={goNext}
                className="rounded-xl bg-lr-primary px-5 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover"
              >
                Continue
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSignup}
              disabled={loading}
              className="rounded-xl bg-lr-primary px-5 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          )}
        </div>

        {message && (
          <p className="mt-4 text-sm text-lr-muted" aria-live="polite">
            {message}
          </p>
        )}
      </div>
    </main>
  )
}
