"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

const exampleCsv = `name,phone,email,source,status,estimated_value,notes
Jane Customer,555-123-4567,jane@example.com,WEBSITE,NEW,450,Needs a callback
Sam Buyer,555-987-1111,,REFERRAL,CAPTURED,900,Captured from referral`

export function LeadImportForm() {
  const router = useRouter()
  const [csv, setCsv] = useState(exampleCsv)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function importLeads(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csv }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage(`Imported ${data.imported} lead${data.imported === 1 ? "" : "s"}.`)
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={importLeads} className="mt-8 space-y-5">
      <div className="rounded-2xl border border-slate-200 p-5">
        <h2 className="text-xl font-bold text-slate-950">Paste CSV</h2>
        <p className="mt-2 text-sm text-slate-600">
          Supported columns include name, phone, email, source, status,
          estimated_value, captured_value, revenue, and notes.
        </p>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          className="mt-5 min-h-72 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm outline-none focus:border-slate-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Importing..." : "Import leads"}
      </button>

      {message && <p className="text-sm text-slate-600">{message}</p>}
    </form>
  )
}
