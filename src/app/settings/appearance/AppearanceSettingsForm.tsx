"use client"

import { useEffect, useState } from "react"

type ThemePreference = "LIGHT" | "DARK"

type AppearanceSettingsFormProps = {
  initialPreference: string
}

const options: Array<{
  value: ThemePreference
  label: string
  description: string
}> = [
  {
    value: "DARK",
    label: "Executive dark",
    description: "The primary LeadReply look: sleek, focused, and lower glare.",
  },
  {
    value: "LIGHT",
    label: "Light",
    description: "A brighter workspace for owners who prefer daytime mode.",
  },
]

function resolveTheme(preference: ThemePreference) {
  return preference === "DARK" ? "dark" : "light"
}

function applyTheme(preference: ThemePreference) {
  const resolvedTheme = resolveTheme(preference)

  window.localStorage.setItem("leadreply-theme", preference)
  document.cookie = `leadreply-theme=${preference}; path=/; max-age=31536000; samesite=lax`
  document.documentElement.dataset.theme = resolvedTheme
  document.documentElement.dataset.themePreference = preference
}

export function AppearanceSettingsForm({
  initialPreference,
}: AppearanceSettingsFormProps) {
  const [preference, setPreference] = useState<ThemePreference>(
    options.some((option) => option.value === initialPreference)
      ? (initialPreference as ThemePreference)
      : "DARK"
  )
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    applyTheme(preference)
  }, [preference])

  async function savePreference(nextPreference: ThemePreference) {
    setPreference(nextPreference)
    setMessage("")
    setLoading(true)
    applyTheme(nextPreference)

    try {
      const res = await fetch("/api/account/appearance", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          themePreference: nextPreference,
        }),
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setMessage(body.error || "Something went wrong.")
        return
      }

      setMessage("Appearance updated.")
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl border-t border-lr-border pt-6">
      <div className="space-y-3">
      {options.map((option) => {
        const selected = preference === option.value

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => savePreference(option.value)}
            className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition ${
              selected
                ? "border-lr-primary bg-lr-surface-raised shadow-sm"
                : "border-lr-border bg-lr-surface hover:bg-lr-hover"
            }`}
          >
            <span className="min-w-0">
              <span className="block text-sm font-bold text-lr-strong">
                {option.label}
              </span>
              <span className="mt-1 block text-sm leading-6 text-lr-muted">
                {option.description}
              </span>
            </span>
            <span
              aria-hidden="true"
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                selected
                  ? "border-lr-primary bg-lr-primary"
                  : "border-lr-border-strong bg-lr-surface"
              }`}
            >
              {selected && (
                <span className="h-2 w-2 rounded-full bg-lr-on-primary" />
              )}
            </span>
          </button>
        )
      })}
      </div>
      <div className="mt-4 min-h-5">
        {loading && <p className="text-sm font-semibold text-lr-muted">Saving...</p>}
        {message && !loading && (
          <p className="text-sm font-semibold text-lr-muted">{message}</p>
        )}
      </div>
    </div>
  )
}
