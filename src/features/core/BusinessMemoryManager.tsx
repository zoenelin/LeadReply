"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import {
  businessMemorySourceTextLimit,
  businessMemorySourceTypes,
  businessMemoryStatuses,
  getBusinessMemoryCategoryLabel,
  getBusinessMemoryStats,
} from "@/services/business-memory/memory"
import type { ComplianceRule } from "@/services/compliance/guardrails"

type SerializedMemorySource = {
  id: string
  sourceType: string
  sourceName: string
  status: string
  createdAt: string
}

type SerializedMemoryItem = {
  id: string
  category: string
  title: string
  content: string
  status: string
  confidence: number
  sourceType: string
  sourceName: string
  createdAt: string
}

type PendingMemoryFile = {
  name: string
  text: string
}

type BusinessMemoryManagerProps = {
  sources: SerializedMemorySource[]
  items: SerializedMemoryItem[]
  compliance: {
    label: string
    state: string
    ruleCount: number
    severeCount: number
    rules: ComplianceRule[]
  }
}

function statusClassName(status: string) {
  if (status === businessMemoryStatuses.approved) {
    return "bg-emerald-50 text-emerald-700"
  }

  if (status === businessMemoryStatuses.rejected) {
    return "bg-lr-hover text-lr-muted"
  }

  return "bg-amber-50 text-amber-700"
}

function sourceTypeLabel(value: string) {
  return (
    businessMemorySourceTypes.find((sourceType) => sourceType.value === value)
      ?.label ?? value
  )
}

function pluralize(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`
}

export function BusinessMemoryManager({
  sources,
  items,
  compliance,
}: BusinessMemoryManagerProps) {
  const router = useRouter()
  const [sourceType, setSourceType] = useState("WEBSITE")
  const [sourceName, setSourceName] = useState("")
  const [rawText, setRawText] = useState("")
  const [pendingFiles, setPendingFiles] = useState<PendingMemoryFile[]>([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const stats = useMemo(() => getBusinessMemoryStats(items), [items])
  const sortedItems = [...items].sort((left, right) => {
    const statusOrder: Record<string, number> = {
      NEEDS_REVIEW: 0,
      APPROVED: 1,
      REJECTED: 2,
    }

    return (
      (statusOrder[left.status] ?? 9) - (statusOrder[right.status] ?? 9) ||
      right.confidence - left.confidence
    )
  })

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) {
      return
    }

    const files = Array.from(fileList)
    const loadedFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        text: (await file.text()).slice(0, businessMemorySourceTextLimit),
      }))
    )

    setSourceType("FILE_UPLOAD")
    setPendingFiles((current) => [...current, ...loadedFiles])
    setMessage(`${pluralize(loadedFiles.length, "file")} ready to import.`)
  }

  async function importSource(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage("")

    const manualText = rawText.trim()
    const imports = [
      ...(manualText
        ? [
            {
              sourceType,
              sourceName,
              rawText: manualText,
            },
          ]
        : []),
      ...pendingFiles.map((file) => ({
        sourceType: "FILE_UPLOAD",
        sourceName: file.name,
        rawText: file.text,
      })),
    ]

    if (imports.length === 0) {
      setMessage("Add pasted business information or choose one or more files.")
      return
    }

    setLoading(true)

    try {
      let importedSources = 0
      let createdItems = 0

      for (const source of imports) {
        const res = await fetch("/api/business-memory/sources", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(source),
        })
        const data = await res.json()

        if (!res.ok) {
          const importedMessage =
            importedSources > 0
              ? `Imported ${pluralize(importedSources, "source")}, then stopped. `
              : ""

          setMessage(
            `${importedMessage}${data.error || "Something went wrong."}`
          )
          return
        }

        importedSources += 1
        createdItems += data.items?.length ?? 0
      }

      setSourceName("")
      setRawText("")
      setPendingFiles([])
      setMessage(
        `Imported ${pluralize(importedSources, "source")} and created ${pluralize(
          createdItems,
          "memory draft"
        )}.`
      )
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function updateItem(id: string, status: string) {
    setMessage("")

    try {
      const res = await fetch(`/api/business-memory/items/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Business memory updated.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-lr-border bg-lr-surface-muted p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Setup shortcut
        </p>
        <h2 className="mt-2 text-2xl font-bold text-lr-strong">
          Let LeadReply learn from what already exists
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-lr-muted">
          Paste website copy, upload menus, attach service exports, or bring in
          notes from other platforms. LeadReply turns each source into draft
          business memory so the owner only approves what is correct.
        </p>

        <form onSubmit={importSource} className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Source type
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 outline-none focus:border-lr-strong"
              >
                {businessMemorySourceTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Source name
              </label>
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
                placeholder="Website homepage, menu PDF, Square service export"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Add existing files
            </label>
            <input
              type="file"
              multiple
              accept=".txt,.csv,.tsv,.md,.json"
              onChange={(e) => handleFiles(e.target.files)}
              className="w-full rounded-xl border border-dashed border-lr-border-strong bg-lr-surface px-4 py-3 text-sm text-lr-muted"
            />
            {pendingFiles.length > 0 && (
              <div className="mt-3 rounded-xl border border-lr-border bg-lr-surface p-3">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <p className="text-sm font-semibold text-lr-body">
                    {pluralize(pendingFiles.length, "file")} selected
                  </p>
                  <button
                    type="button"
                    onClick={() => setPendingFiles([])}
                    className="text-left text-sm font-semibold text-lr-primary hover:text-lr-primary-hover"
                  >
                    Clear files
                  </button>
                </div>
                <ul className="mt-2 space-y-2 text-sm text-lr-muted">
                  {pendingFiles.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex flex-col justify-between gap-2 rounded-lg bg-lr-surface-muted px-3 py-2 sm:flex-row sm:items-center"
                    >
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingFiles((current) =>
                            current.filter(
                              (_, fileIndex) => fileIndex !== index
                            )
                          )
                        }
                        className="shrink-0 text-left text-xs font-semibold text-lr-muted hover:text-lr-strong"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Paste another source
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="min-h-52 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="Paste services, prices, hours, booking rules, FAQs, offers, or exported API data here. You can import this together with the selected files."
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-lr-primary px-5 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
            >
              {loading ? "Importing..." : "Import sources"}
            </button>
            {message && <p className="text-sm text-lr-muted">{message}</p>}
          </div>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-lr-border p-5">
          <p className="text-sm text-lr-subtle">Total facts</p>
          <p className="mt-2 text-3xl font-bold text-lr-strong">
            {stats.total}
          </p>
        </div>
        <div className="rounded-2xl border border-lr-border p-5">
          <p className="text-sm text-lr-subtle">Approved</p>
          <p className="mt-2 text-3xl font-bold text-lr-strong">
            {stats.approved}
          </p>
        </div>
        <div className="rounded-2xl border border-lr-border p-5">
          <p className="text-sm text-lr-subtle">Needs review</p>
          <p className="mt-2 text-3xl font-bold text-lr-strong">
            {stats.needsReview}
          </p>
        </div>
        <div className="rounded-2xl border border-lr-border p-5">
          <p className="text-sm text-lr-subtle">Sources</p>
          <p className="mt-2 text-3xl font-bold text-lr-strong">
            {sources.length}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-lr-border p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Review rules
            </p>
            <h2 className="mt-2 text-xl font-bold text-lr-strong">
              Active safeguards for {compliance.label}
              {compliance.state ? ` in ${compliance.state}` : ""}
            </h2>
            <p className="mt-2 text-sm text-lr-muted">
              LeadReply uses these behind the scenes when drafting replies,
              marketing, and SEO content. They are not legal advice, but they
              help keep risky claims out of customer replies and draft content.
            </p>
          </div>
          <div className="rounded-xl bg-lr-surface-muted px-4 py-3 text-sm font-semibold text-lr-body">
            {compliance.ruleCount} rules, {compliance.severeCount} require
            strict review
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {compliance.rules.map((rule) => (
            <article
              key={rule.id}
              className="rounded-xl border border-lr-border bg-lr-surface-muted p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-lr-strong">{rule.title}</h3>
                <span className="rounded-lg bg-lr-surface px-2 py-1 text-xs font-bold text-lr-body">
                  {rule.severity.toLowerCase()}
                </span>
              </div>
              <p className="mt-2 text-sm text-lr-muted">{rule.summary}</p>
              <p className="mt-3 text-xs font-semibold text-lr-subtle">
                Source: {rule.sourceName}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-lr-border p-5">
        <h2 className="text-xl font-bold text-lr-strong">
          Business memory review
        </h2>
        <p className="mt-2 text-sm text-lr-muted">
          Approved items become trusted context for AI summaries, future
          marketing drafts, SEO work, and admin setup. Reject anything that is
          wrong or out of date.
        </p>

        <div className="mt-5 space-y-3">
          {sortedItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-lr-border-strong p-6 text-sm text-lr-muted">
              No business memory yet. Import a source above to create draft
              facts.
            </div>
          ) : (
            sortedItems.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-lr-border p-4"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-lr-surface-muted px-2 py-1 text-xs font-bold text-lr-body">
                        {getBusinessMemoryCategoryLabel(item.category)}
                      </span>
                      <span
                        className={`rounded-lg px-2 py-1 text-xs font-bold ${statusClassName(
                          item.status
                        )}`}
                      >
                        {item.status.replace("_", " ").toLowerCase()}
                      </span>
                      <span className="rounded-lg bg-lr-surface-muted px-2 py-1 text-xs font-bold text-lr-muted">
                        {item.confidence}% confidence
                      </span>
                    </div>
                    <h3 className="mt-3 font-bold text-lr-strong">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-lr-muted">
                      {item.content}
                    </p>
                    <p className="mt-3 text-xs font-semibold text-lr-subtle">
                      {sourceTypeLabel(item.sourceType)}
                      {item.sourceName ? `: ${item.sourceName}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateItem(item.id, businessMemoryStatuses.approved)
                      }
                      className="rounded-lg bg-lr-primary px-3 py-2 text-xs font-semibold text-lr-on-primary hover:bg-lr-primary-hover"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateItem(item.id, businessMemoryStatuses.rejected)
                      }
                      className="rounded-lg border border-lr-border-strong px-3 py-2 text-xs font-semibold text-lr-body hover:bg-lr-hover"
                    >
                      Reject
                    </button>
                    {item.status !== businessMemoryStatuses.needsReview && (
                      <button
                        type="button"
                        onClick={() =>
                          updateItem(
                            item.id,
                            businessMemoryStatuses.needsReview
                          )
                        }
                        className="rounded-lg border border-lr-border-strong px-3 py-2 text-xs font-semibold text-lr-body hover:bg-lr-hover"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {sources.length > 0 && (
        <section className="rounded-2xl border border-lr-border p-5">
          <h2 className="text-xl font-bold text-lr-strong">Imported sources</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {sources.map((source) => (
              <article
                key={source.id}
                className="rounded-xl bg-lr-surface-muted p-4"
              >
                <p className="font-bold text-lr-strong">
                  {source.sourceName || sourceTypeLabel(source.sourceType)}
                </p>
                <p className="mt-1 text-sm text-lr-muted">
                  {sourceTypeLabel(source.sourceType)} -{" "}
                  {new Date(source.createdAt).toLocaleDateString()}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
