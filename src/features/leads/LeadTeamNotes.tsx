"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type LeadTeamNote = {
  id: string
  body: string
  authorName: string
  createdAt: Date | string
}

type LeadTeamNotesProps = {
  leadId: string
  notes: LeadTeamNote[]
}

function formatNoteDate(value: Date | string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function LeadTeamNotes({ leadId, notes }: LeadTeamNotesProps) {
  const router = useRouter()
  const [body, setBody] = useState("")
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function addNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/team-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId,
          body,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setBody("")
      setAdding(false)
      setMessage("Note added.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-lr-border p-5">
      <div>
        <p className="text-sm font-medium text-lr-subtle">Notes</p>
        <h2 className="mt-2 text-xl font-bold text-lr-strong">
          Timeline
        </h2>
      </div>

      <div className="mt-5 space-y-3">
        {notes.length === 0 ? (
          <div className="rounded-xl bg-lr-surface-muted px-4 py-3 text-sm text-lr-muted">
            No notes yet.
          </div>
        ) : (
          notes.map((note) => (
            <article
              key={note.id}
              className="rounded-xl bg-lr-surface-muted px-4 py-3"
            >
              <p className="text-sm font-semibold text-lr-strong">
                {note.authorName || "Team"}
              </p>
              <p className="mt-1 text-xs text-lr-subtle">
                {formatNoteDate(note.createdAt)}
              </p>
              <p className="mt-3 whitespace-pre-line text-sm text-lr-body">
                {note.body}
              </p>
            </article>
          ))
        )}
      </div>

      {adding ? (
        <form onSubmit={addNote} className="mt-5 space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-24 w-full rounded-xl border border-lr-border-strong px-4 py-3 text-sm outline-none focus:border-lr-strong"
            placeholder="Add a note."
            required
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-lr-primary px-4 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save note"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setBody("")
                setAdding(false)
              }}
              className="rounded-xl border border-lr-border-strong px-4 py-3 text-sm font-semibold text-lr-strong hover:bg-lr-hover disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-5 rounded-xl bg-lr-primary px-4 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover"
        >
          Add note
        </button>
      )}

      {message && <p className="mt-4 text-sm text-lr-muted">{message}</p>}
    </section>
  )
}
