"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type WidgetSettingsFormProps = {
  business: {
    id: string
    name: string
    widgetGreeting: string
    widgetPrimaryAction: string
    widgetAccentColor: string
  }
  widgetUrl: string
  scriptUrl: string
}

export function WidgetSettingsForm({
  business,
  widgetUrl,
  scriptUrl,
}: WidgetSettingsFormProps) {
  const router = useRouter()
  const [widgetGreeting, setWidgetGreeting] = useState(business.widgetGreeting)
  const [widgetPrimaryAction, setWidgetPrimaryAction] = useState(
    business.widgetPrimaryAction
  )
  const [widgetAccentColor, setWidgetAccentColor] = useState(
    business.widgetAccentColor
  )
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const scriptEmbedCode = `<script src="${scriptUrl}" data-leadreply-business="${business.id}" async></script>`
  const iframeEmbedCode = `<iframe src="${widgetUrl}" title="LeadReply contact widget" style="width:100%;max-width:420px;height:620px;border:0;border-radius:16px;"></iframe>`

  async function saveWidget(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/business/widget", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          widgetGreeting,
          widgetPrimaryAction,
          widgetAccentColor,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Widget settings saved.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
      <form
        onSubmit={saveWidget}
        className="rounded-2xl border border-lr-border p-5"
      >
        <h2 className="text-xl font-bold text-lr-strong">Widget setup</h2>
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Greeting</label>
            <textarea
              value={widgetGreeting}
              onChange={(e) => setWidgetGreeting(e.target.value)}
              className="min-h-28 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              maxLength={180}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Primary request type
            </label>
            <select
              value={widgetPrimaryAction}
              onChange={(e) => setWidgetPrimaryAction(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 outline-none focus:border-lr-strong"
            >
              <option value="CALLBACK">Request a callback</option>
              <option value="TEXT">Text us</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Accent color
            </label>
            <div className="grid gap-3 sm:grid-cols-[80px_1fr]">
              <input
                type="color"
                value={widgetAccentColor}
                onChange={(e) => setWidgetAccentColor(e.target.value)}
                className="h-12 w-full rounded-xl border border-lr-border-strong bg-lr-surface p-1"
              />
              <input
                type="text"
                value={widgetAccentColor}
                onChange={(e) => setWidgetAccentColor(e.target.value)}
                className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
                placeholder="#0f172a"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-lr-primary px-5 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save widget"}
          </button>

          {message && <p className="text-sm text-lr-muted">{message}</p>}
        </div>
      </form>

      <aside className="space-y-5">
        <div className="rounded-2xl border border-lr-border p-5">
          <p className="text-sm font-medium text-lr-subtle">Live link</p>
          <p className="mt-3 break-all rounded-xl bg-lr-surface-muted px-4 py-3 text-sm font-semibold text-lr-body">
            {widgetUrl}
          </p>
          <a
            href={widgetUrl}
            target="_blank"
            className="mt-4 inline-flex rounded-xl border border-lr-border-strong px-4 py-3 text-sm font-semibold text-lr-strong hover:bg-lr-hover"
          >
            Open widget
          </a>
        </div>

        <div className="rounded-2xl border border-lr-border p-5">
          <p className="text-sm font-medium text-lr-subtle">
            Recommended embed
          </p>
          <textarea
            readOnly
            value={scriptEmbedCode}
            className="mt-3 min-h-28 w-full rounded-xl border border-lr-border-strong bg-lr-surface-muted px-4 py-3 text-sm outline-none"
          />
          <p className="mt-3 text-xs text-lr-subtle">
            Use this script for a floating mobile-friendly lead capture widget.
            Submissions flow into LeadReply; AI chat and self-scheduling will
            connect here after those integrations are ready.
          </p>
        </div>

        <div className="rounded-2xl border border-lr-border p-5">
          <p className="text-sm font-medium text-lr-subtle">Inline iframe</p>
          <textarea
            readOnly
            value={iframeEmbedCode}
            className="mt-3 min-h-40 w-full rounded-xl border border-lr-border-strong bg-lr-surface-muted px-4 py-3 text-sm outline-none"
          />
        </div>

        <div className="rounded-2xl border border-lr-border p-5">
          <p className="text-sm font-medium text-lr-subtle">Preview</p>
          <div
            className="mt-4 rounded-2xl p-5 text-white"
            style={{ backgroundColor: widgetAccentColor }}
          >
            <p className="text-sm font-semibold">{business.name}</p>
            <h3 className="mt-3 text-2xl font-bold">
              {widgetPrimaryAction === "TEXT" ? "Text us" : "Request a callback"}
            </h3>
            <p className="mt-3 text-sm text-white/90">{widgetGreeting}</p>
          </div>
        </div>
      </aside>
    </div>
  )
}
