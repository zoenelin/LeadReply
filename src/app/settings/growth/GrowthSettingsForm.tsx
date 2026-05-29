"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

const marketingChannelOptions = [
  "Google Business Profile",
  "Facebook",
  "Instagram",
  "TikTok",
  "LinkedIn",
  "Email",
  "Direct mail",
]

const marketingGoalOptions = [
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
  const [marketingGoals, setMarketingGoals] = useState(
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
          marketingGoals: listToValue(marketingGoals),
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

      setMessage("Growth setup saved.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <section className="rounded-2xl border border-slate-200 p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          SEO foundation
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Local search setup
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Collect the exact services, locations, keywords, and pages needed to
          improve local search visibility.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Primary services
            </label>
            <textarea
              value={seoPrimaryServices}
              onChange={(e) => setSeoPrimaryServices(e.target.value)}
              className="min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
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
              className="min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
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
              className="min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
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
              className="min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
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
              className="min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
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
              className="min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="Common questions, seasonal topics, before/after content"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium">SEO notes</label>
          <textarea
            value={seoSetupNotes}
            onChange={(e) => setSeoSetupNotes(e.target.value)}
            className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
            placeholder="Extra search visibility notes, Google profile cleanup, website concerns."
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Marketing plan
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Social and campaign setup
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Build the practical marketing brief LeadReply needs for social
          presence, campaigns, offers, and recurring content.
        </p>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium">Marketing channels</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {marketingChannelOptions.map((channel) => (
              <label
                key={channel}
                className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700"
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

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium">Marketing goals</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {marketingGoalOptions.map((goal) => (
              <label
                key={goal}
                className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={marketingGoals.includes(goal)}
                  onChange={() =>
                    toggleListItem(goal, marketingGoals, setMarketingGoals)
                  }
                  className="h-4 w-4"
                />
                {goal}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Target audience
            </label>
            <textarea
              value={marketingAudience}
              onChange={(e) => setMarketingAudience(e.target.value)}
              className="min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="Families, homeowners, commuters, brides, office workers"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Offer or promotion
            </label>
            <textarea
              value={marketingOffer}
              onChange={(e) => setMarketingOffer(e.target.value)}
              className="min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="Free estimate, first visit discount, seasonal package"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Content themes
            </label>
            <textarea
              value={marketingContentThemes}
              onChange={(e) => setMarketingContentThemes(e.target.value)}
              className="min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
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
              className="min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="Professional, friendly, premium, funny, calm, urgent"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[260px_1fr]">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Posting cadence
            </label>
            <select
              value={marketingPostingCadence}
              onChange={(e) => setMarketingPostingCadence(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
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
              Marketing notes
            </label>
            <textarea
              value={marketingSetupNotes}
              onChange={(e) => setMarketingSetupNotes(e.target.value)}
              className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="Existing social handles, photo/video needs, brand rules, launch campaign notes."
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save growth setup"}
        </button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </div>
    </form>
  )
}
