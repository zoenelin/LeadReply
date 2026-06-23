"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  businessRoleOptions,
  capabilityLabels,
  roleCan,
  type BusinessCapability,
} from "@/lib/security/permissions"

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

type LastInvite = {
  link: string
  code: string
  expiresAt: string
}

const capabilityOrder: BusinessCapability[] = [
  "manageBilling",
  "manageBusinessProfile",
  "manageTeam",
  "manageAutomation",
  "managePhoneLines",
  "manageLeads",
  "manageCustomers",
  "manageJobs",
  "manageAppointments",
  "manageMessages",
  "manageCrmViews",
  "manageReviews",
  "requestGrowthServices",
  "manageMarketing",
  "manageSeo",
  "viewAnalytics",
  "exportData",
]

const statusOptions = [
  { value: "INVITED", label: "Invited" },
  { value: "ACTIVE", label: "Active" },
  { value: "DISABLED", label: "Disabled" },
]

const expirationOptions = [
  { value: "24", label: "24 hours" },
  { value: "72", label: "3 days" },
  { value: "168", label: "7 days" },
]

export function TeamSettingsForm({ members }: TeamSettingsFormProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("OFFICE")
  const [expiresInHours, setExpiresInHours] = useState("168")
  const [lastInvite, setLastInvite] = useState<LastInvite | null>(null)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function createInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setLastInvite(null)

    try {
      const res = await fetch("/api/team-invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, role, expiresInHours }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setName("")
      setEmail("")
      setRole("OFFICE")
      setExpiresInHours("168")
      setLastInvite(data.invite)
      setMessage("Invite generated. Copy the link or code now; it will not be shown again.")
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
        onSubmit={createInvite}
        className="rounded-2xl border border-lr-border p-5"
      >
        <h2 className="text-xl font-bold text-lr-strong">Invite teammate</h2>
        <p className="mt-2 text-sm leading-6 text-lr-muted">
          Pick a role, generate an expiring invite, and share it with the worker.
          Billing and plan controls stay owner-only.
        </p>
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="Jane Manager"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="jane@example.com"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 outline-none focus:border-lr-strong"
            >
              {businessRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Invite expires
            </label>
            <select
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 outline-none focus:border-lr-strong"
            >
              {expirationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-lr-primary px-5 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate invite"}
          </button>
          {lastInvite && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-lr-body">
              <p className="font-bold text-lr-strong">Invite ready</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-lr-subtle">
                Link
              </p>
              <p className="mt-1 break-all rounded-xl bg-lr-surface px-3 py-2 font-semibold text-lr-strong">
                {lastInvite.link}
              </p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-lr-subtle">
                Code
              </p>
              <p className="mt-1 rounded-xl bg-lr-surface px-3 py-2 text-lg font-black tracking-wide text-lr-strong">
                {lastInvite.code}
              </p>
              <p className="mt-3 text-xs font-semibold text-lr-muted">
                Expires {new Date(lastInvite.expiresAt).toLocaleString()}
              </p>
              <p className="mt-2 text-xs font-semibold text-lr-muted">
                Share the link for the easiest setup. If you want to use the
                code instead, send the worker to /invite and give them this
                code.
              </p>
            </div>
          )}
          {message && <p className="text-sm text-lr-muted">{message}</p>}
        </div>
      </form>

      <section className="rounded-2xl border border-lr-border p-5">
        <h2 className="text-xl font-bold text-lr-strong">Team access</h2>
        <p className="mt-2 text-sm leading-6 text-lr-muted">
          Accepted teammates can sign in with their own account. This role map
          defines what each person can see or change after they accept access.
        </p>
        <div className="mt-5 space-y-3">
          {members.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-lr-border-strong p-6 text-center">
              <p className="font-bold text-lr-strong">No teammates yet</p>
              <p className="mt-1 text-sm text-lr-muted">
                Add managers or staff who will help work leads.
              </p>
            </div>
          ) : (
            members.map((member) => (
              <article
                key={member.id}
                className="rounded-2xl border border-lr-border p-4"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="font-bold text-lr-strong">
                      {member.name || member.email}
                    </h3>
                    <p className="mt-1 text-sm text-lr-muted">
                      {member.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    className="rounded-xl border border-lr-border-strong px-3 py-2 text-sm font-semibold text-lr-body hover:bg-lr-hover"
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
                    className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 text-sm outline-none focus:border-lr-strong"
                  >
                    {businessRoleOptions.map((option) => (
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
                    className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 text-sm outline-none focus:border-lr-strong"
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

      <section className="rounded-2xl border border-lr-border p-5 lg:col-span-2">
        <h2 className="text-xl font-bold text-lr-strong">
          Planned permission rules
        </h2>
        <p className="mt-2 text-sm leading-6 text-lr-muted">
          Owners keep billing and plan control. Managers run daily operations.
          Office staff work leads, messages, scheduling, and jobs. Technicians
          focus on assigned job work. Marketing users handle growth requests.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-lr-border text-xs uppercase tracking-wide text-lr-subtle">
                <th className="py-3 pr-4">Capability</th>
                {businessRoleOptions.map((role) => (
                  <th key={role.value} className="px-4 py-3">
                    {role.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {capabilityOrder.map((capability) => (
                <tr key={capability} className="border-b border-lr-border">
                  <td className="py-3 pr-4 font-semibold text-lr-body">
                    {capabilityLabels[capability]}
                  </td>
                  {businessRoleOptions.map((role) => {
                    const allowed = roleCan(role.value, capability)

                    return (
                      <td key={role.value} className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            allowed
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-lr-hover text-lr-subtle"
                          }`}
                        >
                          {allowed ? "Allowed" : "Blocked"}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
