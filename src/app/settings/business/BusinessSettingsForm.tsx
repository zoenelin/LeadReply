"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

const businessTypes = [
  { value: "HOME_SERVICES", label: "Home services" },
  { value: "BEAUTY_SERVICES", label: "Beauty services" },
  { value: "FOOD_SERVICES", label: "Food and restaurants" },
]

type BusinessSettingsFormProps = {
  initialBusiness: {
    name: string
    phone: string
    businessType: string
    replyTemplate: string
  }
}

export function BusinessSettingsForm({
  initialBusiness,
}: BusinessSettingsFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialBusiness.name)
  const [phone, setPhone] = useState(initialBusiness.phone)
  const [businessType, setBusinessType] = useState(
    initialBusiness.businessType
  )
  const [replyTemplate, setReplyTemplate] = useState(
    initialBusiness.replyTemplate
  )
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/business", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          businessType,
          replyTemplate,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Business settings saved.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Business name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Business phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Business category
        </label>
        <select
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
          required
        >
          {businessTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Missed call reply template
        </label>
        <textarea
          value={replyTemplate}
          onChange={(e) => setReplyTemplate(e.target.value)}
          className="min-h-32 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
          maxLength={500}
          placeholder="Thanks for calling. How can we help?"
        />
        <p className="mt-1 text-xs text-slate-500">
          This is the message LeadReply will use as your saved missed call
          reply.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save changes"}
      </button>

      {message && <p className="text-sm text-slate-600">{message}</p>}
    </form>
  )
}
