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
  const [authorName, setAuthorName] = useState("Team")
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
          authorName,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setBody("")
      setMessage("Note added.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function deleteNote(id: string) {
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch(`/api/team-notes/${id}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Note deleted.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 p-5">
      <div>
        <p className="text-sm font-medium text-slate-500">Team notes</p>
        <h2 className="mt-2 text-xl font-bold text-slate-950">
          Internal timeline
        </h2>
      </div>

      <form onSubmit={addNote} className="mt-5 space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
            placeholder="Add an internal note for the team."
            required
          />
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="h-fit w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
            placeholder="Author"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Add note"}
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {notes.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            No internal notes yet.
          </div>
        ) : (
          notes.map((note) => (
            <article key={note.id} className="rounded-xl bg-slate-50 px-4 py-3">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {note.authorName || "Team"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatNoteDate(note.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteNote(note.id)}
                  disabled={loading}
                  className="w-fit rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-slate-700">
                {note.body}
              </p>
            </article>
          ))
        )}
      </div>

      {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
    </section>
  )
}
