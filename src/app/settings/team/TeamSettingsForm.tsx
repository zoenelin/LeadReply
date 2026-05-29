"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type TeamMember = {
  id: string
  name: string
  email: string
  role: string
  status: string
}

type TeamSettingsFormProps = {
  members: TeamMember[]
}

const roleOptions = [
  { value: "OWNER", label: "Owner" },
  { value: "MANAGER", label: "Manager" },
  { value: "STAFF", label: "Staff" },
  { value: "VIEWER", label: "Viewer" },
]

const statusOptions = [
  { value: "INVITED", label: "Invited" },
  { value: "ACTIVE", label: "Active" },
  { value: "DISABLED", label: "Disabled" },
]

export function TeamSettingsForm({ members }: TeamSettingsFormProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("STAFF")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function addMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/team-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, role }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setName("")
      setEmail("")
      setRole("STAFF")
      setMessage("Team member added.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function updateMember(id: string, field: "role" | "status", value: string) {
    setMessage("")

    try {
      const res = await fetch(`/api/team-members/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [field]: value }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Team member updated.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    }
  }

  async function removeMember(id: string) {
    setMessage("")

    try {
      const res = await fetch(`/api/team-members/${id}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Team member removed.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.2fr]">
      <form
        onSubmit={addMember}
        className="rounded-2xl border border-slate-200 p-5"
      >
        <h2 className="text-xl font-bold text-slate-950">Invite teammate</h2>
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="Jane Manager"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="jane@example.com"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add team member"}
          </button>
          {message && <p className="text-sm text-slate-600">{message}</p>}
        </div>
      </form>

      <section className="rounded-2xl border border-slate-200 p-5">
        <h2 className="text-xl font-bold text-slate-950">Team access</h2>
        <div className="mt-5 space-y-3">
          {members.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center">
              <p className="font-bold text-slate-950">No teammates yet</p>
              <p className="mt-1 text-sm text-slate-600">
                Add managers or staff who will help work leads.
              </p>
            </div>
          ) : (
            members.map((member) => (
              <article
                key={member.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="font-bold text-slate-950">
                      {member.name || member.email}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {member.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <select
                    value={member.role}
                    onChange={(e) =>
                      updateMember(member.id, "role", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={member.status}
                    onChange={(e) =>
                      updateMember(member.id, "status", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
