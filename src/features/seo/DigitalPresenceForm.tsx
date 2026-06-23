"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type DigitalPresenceFormProps = {
  initialPresence: {
    website: string
    websitePresenceStatus: string
    googleBusinessProfileUrl: string
    googleBusinessProfileStatus: string
    facebookPageUrl: string
    facebookPageStatus: string
    instagramProfileUrl: string
    instagramProfileStatus: string
    calendarBookingUrl: string
    bookingLinkStatus: string
    googleReviewUrl: string
    reviewPlatformStatus: string
    logoUrl: string
    brandAssetsStatus: string
    brandAssetNotes: string
    digitalPresenceNotes: string
    wantsLeadReplySetupHelp: boolean
  }
}

const statusOptions = [
  { value: "UNKNOWN", label: "Not sure yet" },
  { value: "CONNECTED", label: "Connected" },
  { value: "MISSING", label: "Missing" },
  { value: "NEEDS_WORK", label: "Needs work" },
  { value: "NOT_NEEDED", label: "Not needed" },
]

function PresenceRow({
  label,
  urlLabel,
  url,
  status,
  placeholder,
  onUrlChange,
  onStatusChange,
}: {
  label: string
  urlLabel: string
  url: string
  status: string
  placeholder: string
  onUrlChange: (value: string) => void
  onStatusChange: (value: string) => void
}) {
  return (
    <div className="rounded-2xl border border-lr-border p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h3 className="font-bold text-lr-strong">{label}</h3>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-2 text-sm outline-none focus:border-lr-strong"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <label className="mt-4 block text-sm font-medium">{urlLabel}</label>
      <input
        type="url"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
        placeholder={placeholder}
      />
    </div>
  )
}

export function DigitalPresenceForm({
  initialPresence,
}: DigitalPresenceFormProps) {
  const router = useRouter()
  const [website, setWebsite] = useState(initialPresence.website)
  const [websitePresenceStatus, setWebsitePresenceStatus] = useState(
    initialPresence.websitePresenceStatus
  )
  const [googleBusinessProfileUrl, setGoogleBusinessProfileUrl] = useState(
    initialPresence.googleBusinessProfileUrl
  )
  const [googleBusinessProfileStatus, setGoogleBusinessProfileStatus] =
    useState(initialPresence.googleBusinessProfileStatus)
  const [facebookPageUrl, setFacebookPageUrl] = useState(
    initialPresence.facebookPageUrl
  )
  const [facebookPageStatus, setFacebookPageStatus] = useState(
    initialPresence.facebookPageStatus
  )
  const [instagramProfileUrl, setInstagramProfileUrl] = useState(
    initialPresence.instagramProfileUrl
  )
  const [instagramProfileStatus, setInstagramProfileStatus] = useState(
    initialPresence.instagramProfileStatus
  )
  const [calendarBookingUrl, setCalendarBookingUrl] = useState(
    initialPresence.calendarBookingUrl
  )
  const [bookingLinkStatus, setBookingLinkStatus] = useState(
    initialPresence.bookingLinkStatus
  )
  const [googleReviewUrl, setGoogleReviewUrl] = useState(
    initialPresence.googleReviewUrl
  )
  const [reviewPlatformStatus, setReviewPlatformStatus] = useState(
    initialPresence.reviewPlatformStatus
  )
  const [logoUrl, setLogoUrl] = useState(initialPresence.logoUrl)
  const [brandAssetsStatus, setBrandAssetsStatus] = useState(
    initialPresence.brandAssetsStatus
  )
  const [brandAssetNotes, setBrandAssetNotes] = useState(
    initialPresence.brandAssetNotes
  )
  const [digitalPresenceNotes, setDigitalPresenceNotes] = useState(
    initialPresence.digitalPresenceNotes
  )
  const [wantsLeadReplySetupHelp, setWantsLeadReplySetupHelp] = useState(
    initialPresence.wantsLeadReplySetupHelp
  )
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/business/digital-presence", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          website,
          websitePresenceStatus,
          googleBusinessProfileUrl,
          googleBusinessProfileStatus,
          facebookPageUrl,
          facebookPageStatus,
          instagramProfileUrl,
          instagramProfileStatus,
          calendarBookingUrl,
          bookingLinkStatus,
          googleReviewUrl,
          reviewPlatformStatus,
          logoUrl,
          brandAssetsStatus,
          brandAssetNotes,
          digitalPresenceNotes,
          wantsLeadReplySetupHelp,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Digital presence saved.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border border-lr-border p-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Digital presence
          </p>
          <h2 className="mt-2 text-2xl font-bold text-lr-strong">
            Track what exists and what LeadReply can help set up later
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-lr-muted">
            These answers tell LeadReply whether the business already has a
            website, Google profile, social pages, booking path, reviews, and
            brand assets. Missing items become future service opportunities.
          </p>
        </div>
        <label className="flex max-w-sm items-start gap-3 rounded-2xl bg-lr-surface-muted p-4 text-sm font-semibold text-lr-body">
          <input
            type="checkbox"
            checked={wantsLeadReplySetupHelp}
            onChange={(e) => setWantsLeadReplySetupHelp(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          LeadReply can track missing pieces as future setup services.
        </label>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <PresenceRow
          label="Website"
          urlLabel="Website URL"
          url={website}
          status={websitePresenceStatus}
          placeholder="https://example.com"
          onUrlChange={setWebsite}
          onStatusChange={setWebsitePresenceStatus}
        />
        <PresenceRow
          label="Google Business Profile"
          urlLabel="Google profile URL"
          url={googleBusinessProfileUrl}
          status={googleBusinessProfileStatus}
          placeholder="https://g.page/..."
          onUrlChange={setGoogleBusinessProfileUrl}
          onStatusChange={setGoogleBusinessProfileStatus}
        />
        <PresenceRow
          label="Facebook"
          urlLabel="Facebook page URL"
          url={facebookPageUrl}
          status={facebookPageStatus}
          placeholder="https://facebook.com/..."
          onUrlChange={setFacebookPageUrl}
          onStatusChange={setFacebookPageStatus}
        />
        <PresenceRow
          label="Instagram"
          urlLabel="Instagram profile URL"
          url={instagramProfileUrl}
          status={instagramProfileStatus}
          placeholder="https://instagram.com/..."
          onUrlChange={setInstagramProfileUrl}
          onStatusChange={setInstagramProfileStatus}
        />
        <PresenceRow
          label="Booking or reservation path"
          urlLabel="Booking link"
          url={calendarBookingUrl}
          status={bookingLinkStatus}
          placeholder="https://booking.example.com/..."
          onUrlChange={setCalendarBookingUrl}
          onStatusChange={setBookingLinkStatus}
        />
        <PresenceRow
          label="Review platform"
          urlLabel="Review request URL"
          url={googleReviewUrl}
          status={reviewPlatformStatus}
          placeholder="Google review link"
          onUrlChange={setGoogleReviewUrl}
          onStatusChange={setReviewPlatformStatus}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-lr-border p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <div>
            <label className="block text-sm font-medium">Logo or asset URL</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="mt-1 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Brand assets</label>
            <select
              value={brandAssetsStatus}
              onChange={(e) => setBrandAssetsStatus(e.target.value)}
              className="mt-1 w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 outline-none focus:border-lr-strong"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">
              Brand asset notes
            </label>
            <textarea
              value={brandAssetNotes}
              onChange={(e) => setBrandAssetNotes(e.target.value)}
              className="mt-1 min-h-24 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="Logo status, photos, colors, examples, or missing brand pieces."
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Digital presence notes
            </label>
            <textarea
              value={digitalPresenceNotes}
              onChange={(e) => setDigitalPresenceNotes(e.target.value)}
              className="mt-1 min-h-24 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="What needs to be created, cleaned up, connected, or verified."
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-lr-primary px-5 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save digital presence"}
        </button>
        {message && <p className="text-sm text-lr-muted">{message}</p>}
      </div>
    </form>
  )
}
