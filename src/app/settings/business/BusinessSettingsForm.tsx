"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { businessCategories, planOptions } from "@/lib/domain/business-options"

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

type BusinessSettingsFormProps = {
  canManageBilling: boolean
  initialBusiness: {
    name: string
    phone: string
    contactName: string
    contactPhonePrimary: string
    contactPhoneSecondary: string
    website: string
    address: string
    city: string
    state: string
    zip: string
    businessType: string
    selectedPlan: string
    bookingNotes: string
    replyTemplate: string
  }
}

export function BusinessSettingsForm({
  canManageBilling,
  initialBusiness,
}: BusinessSettingsFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialBusiness.name)
  const [phone, setPhone] = useState(initialBusiness.phone)
  const [contactName, setContactName] = useState(initialBusiness.contactName)
  const [contactPhonePrimary, setContactPhonePrimary] = useState(
    initialBusiness.contactPhonePrimary
  )
  const [contactPhoneSecondary, setContactPhoneSecondary] = useState(
    initialBusiness.contactPhoneSecondary
  )
  const [website, setWebsite] = useState(initialBusiness.website)
  const [address, setAddress] = useState(initialBusiness.address)
  const [city, setCity] = useState(initialBusiness.city)
  const [state, setState] = useState(initialBusiness.state)
  const [zip, setZip] = useState(initialBusiness.zip)
  const [businessType, setBusinessType] = useState(
    initialBusiness.businessType
  )
  const [selectedPlan, setSelectedPlan] = useState(
    initialBusiness.selectedPlan
  )
  const [bookingNotes, setBookingNotes] = useState(initialBusiness.bookingNotes)
  const [replyTemplate, setReplyTemplate] = useState(
    initialBusiness.replyTemplate
  )
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/business", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          contactName,
          contactPhonePrimary,
          contactPhoneSecondary,
          website,
          address,
          city,
          state,
          zip,
          businessType,
          selectedPlan,
          bookingNotes,
          replyTemplate,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Business settings saved.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-lr-strong">Business profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Business name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Business phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Primary contact
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="Owner or manager"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Contact phone
            </label>
            <input
              type="tel"
              value={contactPhonePrimary}
              onChange={(e) => setContactPhonePrimary(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder={phone || "Primary contact phone"}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Backup phone
            </label>
            <input
              type="tel"
              value={contactPhoneSecondary}
              onChange={(e) => setContactPhoneSecondary(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Website</label>
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
            <label className="mb-1 block text-sm font-medium">State</label>
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

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-lr-strong">
          Category and plan
        </h2>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Business category
          </label>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 outline-none focus:border-lr-strong"
            required
          >
            {businessCategories.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.options.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {canManageBilling ? (
          <div className="grid gap-4 md:grid-cols-3">
            {planOptions.map((plan) => (
              <button
                key={plan.value}
                type="button"
                onClick={() => setSelectedPlan(plan.value)}
                className={`rounded-2xl border p-4 text-left ${
                  selectedPlan === plan.value
                    ? "border-lr-strong bg-lr-surface-muted"
                    : "border-lr-border bg-lr-surface hover:bg-lr-hover"
                }`}
              >
                <p className="font-bold text-lr-strong">{plan.label}</p>
                <p className="mt-2 text-sm text-lr-muted">{plan.tagline}</p>
                <p className="mt-3 text-xs font-semibold text-lr-subtle">
                  Pricing coming soon
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-lr-border bg-lr-surface-muted p-4">
            <p className="text-sm font-bold text-lr-strong">
              Plan changes are owner-only
            </p>
            <p className="mt-2 text-sm text-lr-muted">
              Staff can update business profile details when allowed, but
              billing and plan changes stay with the business owner.
            </p>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-lr-strong">Follow-up setup</h2>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Booking or reservation notes
          </label>
          <textarea
            value={bookingNotes}
            onChange={(e) => setBookingNotes(e.target.value)}
            className="min-h-28 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
            placeholder="Tell us how customers usually book or reserve with you."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Missed call reply template
          </label>
          <textarea
            value={replyTemplate}
            onChange={(e) => setReplyTemplate(e.target.value)}
            className="min-h-32 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
            maxLength={500}
            placeholder="Thanks for calling. How can we help?"
          />
          <p className="mt-1 text-xs text-lr-subtle">
            This is the message LeadReply will use as your saved missed call
            reply.
          </p>
        </div>
      </section>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-lr-primary px-5 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save changes"}
      </button>

      {message && <p className="text-sm text-lr-muted">{message}</p>}
    </form>
  )
}
