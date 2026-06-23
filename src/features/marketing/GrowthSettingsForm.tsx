"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

const marketingChannelOptions = [
  "Let LeadReply choose",
  "Google Business Profile",
  "Facebook",
  "Instagram",
  "TikTok",
  "LinkedIn",
  "Email",
  "Direct mail",
]

const defaultMarketingGoalOptions = [
  "More calls",
  "More booked appointments",
  "More reviews",
  "Seasonal promotion",
  "Brand awareness",
  "Repeat customers",
]

const cadenceOptions = [
  { value: "weekly", label: "Weekly" },
  { value: "twice_weekly", label: "Twice weekly" },
  { value: "three_times_weekly", label: "Three times weekly" },
  { value: "daily", label: "Daily" },
  { value: "seasonal", label: "Seasonal campaigns" },
]

type GrowthSettingsFormProps = {
  mode?: "seo" | "marketing" | "all"
  initialSettings: {
    seoSetupNotes: string
    seoPrimaryServices: string
    seoServiceAreas: string
    seoTargetKeywords: string
    seoCompetitors: string
    seoWebsitePages: string
    seoContentIdeas: string
    marketingSetupNotes: string
    marketingChannels: string
    marketingAudience: string
    marketingGoals: string
    marketingOffer: string
    marketingContentThemes: string
    marketingPostingCadence: string
    marketingBrandVoice: string
  }
}

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function listToValue(items: string[]) {
  return items.join(", ")
}

export function GrowthSettingsForm({
  mode = "all",
  initialSettings,
}: GrowthSettingsFormProps) {
  const router = useRouter()
  const [seoSetupNotes, setSeoSetupNotes] = useState(
    initialSettings.seoSetupNotes
  )
  const [seoPrimaryServices, setSeoPrimaryServices] = useState(
    initialSettings.seoPrimaryServices
  )
  const [seoServiceAreas, setSeoServiceAreas] = useState(
    initialSettings.seoServiceAreas
  )
  const [seoTargetKeywords, setSeoTargetKeywords] = useState(
    initialSettings.seoTargetKeywords
  )
  const [seoCompetitors, setSeoCompetitors] = useState(
    initialSettings.seoCompetitors
  )
  const [seoWebsitePages, setSeoWebsitePages] = useState(
    initialSettings.seoWebsitePages
  )
  const [seoContentIdeas, setSeoContentIdeas] = useState(
    initialSettings.seoContentIdeas
  )
  const [marketingSetupNotes, setMarketingSetupNotes] = useState(
    initialSettings.marketingSetupNotes
  )
  const [marketingChannels, setMarketingChannels] = useState(
    parseList(initialSettings.marketingChannels)
  )
  const [marketingAudience, setMarketingAudience] = useState(
    initialSettings.marketingAudience
  )
  const [marketingGoals] = useState(
    parseList(initialSettings.marketingGoals)
  )
  const [marketingOffer, setMarketingOffer] = useState(
    initialSettings.marketingOffer
  )
  const [marketingContentThemes, setMarketingContentThemes] = useState(
    initialSettings.marketingContentThemes
  )
  const [marketingPostingCadence, setMarketingPostingCadence] = useState(
    initialSettings.marketingPostingCadence || "weekly"
  )
  const [marketingBrandVoice, setMarketingBrandVoice] = useState(
    initialSettings.marketingBrandVoice
  )
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const showSeo = mode !== "marketing"
  const showMarketing = mode !== "seo"

  function toggleListItem(
    value: string,
    currentItems: string[],
    setItems: (items: string[]) => void
  ) {
    setItems(
      currentItems.includes(value)
        ? currentItems.filter((item) => item !== value)
        : [...currentItems, value]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/business/growth", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seoSetupNotes,
          seoPrimaryServices,
          seoServiceAreas,
          seoTargetKeywords,
          seoCompetitors,
          seoWebsitePages,
          seoContentIdeas,
          marketingSetupNotes,
          marketingChannels: listToValue(marketingChannels),
          marketingAudience,
          marketingGoals:
            marketingGoals.length > 0
              ? listToValue(marketingGoals)
              : listToValue(defaultMarketingGoalOptions),
          marketingOffer,
          marketingContentThemes,
          marketingPostingCadence,
          marketingBrandVoice,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Setup saved.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {showSeo && (
        <section className="rounded-2xl border border-lr-border p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            SEO foundation
          </p>
          <h2 className="mt-2 text-2xl font-bold text-lr-strong">
            Local search setup
          </h2>
          <p className="mt-2 text-sm text-lr-muted">
            Collect the exact services, locations, keywords, and pages needed
            to improve local search visibility.
          </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Primary services
            </label>
            <textarea
              value={seoPrimaryServices}
              onChange={(e) => setSeoPrimaryServices(e.target.value)}
              className="min-h-28 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="Brake repair, oil changes, diagnostics, tire rotation"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Service areas
            </label>
            <textarea
              value={seoServiceAreas}
              onChange={(e) => setSeoServiceAreas(e.target.value)}
              className="min-h-28 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="City names, neighborhoods, counties, service radius"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Target keywords
            </label>
            <textarea
              value={seoTargetKeywords}
              onChange={(e) => setSeoTargetKeywords(e.target.value)}
              className="min-h-28 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="Best mechanic near me, emergency plumber, nail salon downtown"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Competitors or examples
            </label>
            <textarea
              value={seoCompetitors}
              onChange={(e) => setSeoCompetitors(e.target.value)}
              className="min-h-28 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="Competitor URLs, Google Maps listings, sites they like"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Website page priorities
            </label>
            <textarea
              value={seoWebsitePages}
              onChange={(e) => setSeoWebsitePages(e.target.value)}
              className="min-h-28 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="Homepage, service pages, location pages, FAQ pages"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              SEO content ideas
            </label>
            <textarea
              value={seoContentIdeas}
              onChange={(e) => setSeoContentIdeas(e.target.value)}
              className="min-h-28 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="Common questions, seasonal topics, before/after content"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium">SEO notes</label>
          <textarea
            value={seoSetupNotes}
            onChange={(e) => setSeoSetupNotes(e.target.value)}
            className="min-h-24 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
            placeholder="Extra search visibility notes, Google profile cleanup, website concerns."
          />
        </div>
        </section>
      )}

      {showMarketing && (
        <section
          id="marketing-brief"
          className="rounded-2xl border border-lr-border p-5"
        >
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Marketing
        </p>
        <h2 className="mt-2 text-2xl font-bold text-lr-strong">
          Simple marketing brief
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-lr-muted">
          Answer what you know. LeadReply can choose the channels, write the
          drafts, and turn this into a usable marketing plan.
        </p>

        <div className="mt-5 rounded-2xl bg-lr-surface-muted p-4">
          <p className="text-sm font-bold text-lr-strong">
            LeadReply assumes the full growth goal
          </p>
          <p className="mt-2 text-sm leading-6 text-lr-muted">
            The default marketing goal is more calls, bookings, reviews, repeat
            customers, brand trust, and revenue. The fields below are only for
            business-specific preferences LeadReply should know.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Best customers
            </label>
            <textarea
              value={marketingAudience}
              onChange={(e) => setMarketingAudience(e.target.value)}
              className="min-h-28 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="Example: busy homeowners, families, brides, commuters, local offices"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Offer</label>
            <textarea
              value={marketingOffer}
              onChange={(e) => setMarketingOffer(e.target.value)}
              className="min-h-28 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="Example: free estimate, first visit discount, seasonal special"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              How often should LeadReply plan posts?
            </label>
            <select
              value={marketingPostingCadence}
              onChange={(e) => setMarketingPostingCadence(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 outline-none focus:border-lr-strong"
            >
              {cadenceOptions.map((cadence) => (
                <option key={cadence.value} value={cadence.value}>
                  {cadence.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Anything LeadReply should avoid?
            </label>
            <textarea
              value={marketingSetupNotes}
              onChange={(e) => setMarketingSetupNotes(e.target.value)}
              className="min-h-24 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="Example: no slang, avoid discounting too often, do not mention certain services"
            />
          </div>
        </div>

        <details className="mt-5 rounded-2xl border border-lr-border bg-lr-surface-muted p-4">
          <summary className="cursor-pointer text-sm font-bold text-lr-strong">
            Optional details for LeadReply
          </summary>
          <div className="mt-5 space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">
                Channels to use or consider
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {marketingChannelOptions.map((channel) => (
                  <label
                    key={channel}
                    className="flex items-center gap-3 rounded-xl bg-lr-surface p-3 text-sm font-semibold text-lr-body"
                  >
                    <input
                      type="checkbox"
                      checked={marketingChannels.includes(channel)}
                      onChange={() =>
                        toggleListItem(
                          channel,
                          marketingChannels,
                          setMarketingChannels
                        )
                      }
                      className="h-4 w-4"
                    />
                    {channel}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Content ideas
                </label>
                <textarea
                  value={marketingContentThemes}
                  onChange={(e) => setMarketingContentThemes(e.target.value)}
                  className="min-h-24 w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 outline-none focus:border-lr-strong"
                  placeholder="Tips, transformations, team intros, customer stories"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Brand voice
                </label>
                <textarea
                  value={marketingBrandVoice}
                  onChange={(e) => setMarketingBrandVoice(e.target.value)}
                  className="min-h-24 w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 outline-none focus:border-lr-strong"
                  placeholder="Professional, friendly, premium, calm, playful"
                />
              </div>
            </div>
          </div>
        </details>
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-lr-primary px-5 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
        >
          {loading
            ? "Saving..."
            : mode === "seo"
              ? "Save SEO setup"
              : mode === "marketing"
                ? "Save marketing setup"
                : "Save setup"}
        </button>
        {message && <p className="text-sm text-lr-muted">{message}</p>}
      </div>
    </form>
  )
}
