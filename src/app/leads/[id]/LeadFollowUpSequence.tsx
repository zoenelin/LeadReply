"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { FollowUpStepStatusButtons } from "@/app/components/FollowUpStepStatusButtons"
import {
  followUpStepStatusClassName,
  getFollowUpStatusLabel,
} from "@/lib/follow-up-sequences"

type LeadFollowUpStep = {
  id: string
  title: string
  message: string
  channel: string
  status: string
  stepOrder: number
  dueAt: string | null
  sentAt: string | null
}

type LeadFollowUpSequenceProps = {
  leadId: string
  customerName: string
  steps: LeadFollowUpStep[]
}

function formatDate(value: string | null) {
  if (!value) {
    return "No date"
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function LeadFollowUpSequence({
  leadId,
  customerName,
  steps,
}: LeadFollowUpSequenceProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  async function createSequence() {
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch(`/api/leads/${leadId}/follow-up-sequence`, {
        method: "POST",
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Follow-up sequence created.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Follow-up sequence
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">
            {steps.length === 0
              ? `Plan next touches for ${customerName}`
              : `${steps.length} planned touch${steps.length === 1 ? "" : "es"}`}
          </h2>
        </div>
        {steps.length === 0 && (
          <button
            type="button"
            disabled={loading}
            onClick={createSequence}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create sequence"}
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {steps.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Create a three-step sequence for this lead, then mark each touch as
            sent or skipped.
          </div>
        ) : (
          steps.map((step) => (
            <div key={step.id} className="rounded-xl bg-slate-50 px-4 py-3">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div>
                  <p className="font-semibold text-slate-950">
                    {step.stepOrder}. {step.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Due {formatDate(step.dueAt)} by {step.channel.toLowerCase()}
                  </p>
                </div>
                <span
                  className={`w-fit rounded-lg px-2 py-1 text-xs font-bold ${followUpStepStatusClassName(
                    step.status
                  )}`}
                >
                  {getFollowUpStatusLabel(step.status)}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-700">{step.message}</p>
              {step.sentAt && (
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Sent {formatDate(step.sentAt)}
                </p>
              )}
              <FollowUpStepStatusButtons
                stepId={step.id}
                status={step.status}
              />
            </div>
          ))
        )}
      </div>

      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
    </div>
  )
}
