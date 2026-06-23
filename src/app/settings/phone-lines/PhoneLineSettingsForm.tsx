"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type PhoneLine = {
  id: string
  label: string
  phoneNumber: string
  provider: string
  providerLineId: string
  routingTarget: string
  routeTargets: {
    id: string
    label: string
    phoneNumber: string
    sortOrder: number
    active: boolean
  }[]
  routingStrategy: string
  planRequired: string
  active: boolean
  notes: string
}

type PhoneLineSettingsFormProps = {
  defaultRoutingTarget: string
  lineLimit: number
  routeTargetLimit: number
  phoneLines: PhoneLine[]
  selectedPlan: string
}

const routingStrategies = [
  ["PRIMARY", "Primary"],
  ["ROUND_ROBIN", "Round robin"],
  ["AFTER_HOURS", "After hours"],
  ["DEPARTMENT", "Department"],
] as const

const planOptions = [
  ["BASIC", "Basic"],
  ["GROWTH", "Growth"],
  ["COMPLETE", "Complete"],
] as const

export function PhoneLineSettingsForm({
  defaultRoutingTarget,
  lineLimit,
  routeTargetLimit,
  phoneLines,
  selectedPlan,
}: PhoneLineSettingsFormProps) {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [loadingKey, setLoadingKey] = useState("")
  const canAddLine = phoneLines.length < lineLimit

  function getPlanRouteLabel(index: number) {
    if (index === 0) {
      return "Primary phone"
    }

    return `Fallback phone ${index + 1}`
  }

  function getRouteTargetsFromForm(formData: FormData) {
    return [0, 1, 2]
      .map((index) => ({
        label: String(formData.get(`routeTargetLabel${index}`) ?? "").trim(),
        phoneNumber: String(formData.get(`routeTargetPhone${index}`) ?? "").trim(),
      }))
      .filter((target) => target.phoneNumber)
      .slice(0, routeTargetLimit)
  }

  function getLineRouteTargets(line: PhoneLine) {
    const targets =
      line.routeTargets.length > 0
        ? line.routeTargets
        : [
            {
              id: `${line.id}:primary`,
              label: "Primary",
              phoneNumber: line.routingTarget,
              sortOrder: 0,
              active: true,
            },
          ]

    return [0, 1, 2].map((index) => {
      const target = targets.find((item) => item.sortOrder === index) ?? targets[index]

      return {
        label:
          target?.label ||
          (index === 0 ? "Primary" : `Fallback ${index + 1}`),
        phoneNumber: target?.phoneNumber ?? "",
      }
    })
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")
    setLoadingKey("create")

    const form = event.currentTarget
    const formData = new FormData(form)
    const payload = Object.fromEntries(formData.entries())
    const routeTargets = getRouteTargetsFromForm(formData)

    try {
      const res = await fetch("/api/phone-lines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          routingTarget: routeTargets[0]?.phoneNumber ?? "",
          routeTargets,
          active: true,
        }),
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setMessage(body.error || "Something went wrong.")
        return
      }

      form.reset()
      setMessage("Phone line added.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoadingKey("")
    }
  }

  async function updateLine(
    id: string,
    field: "routingStrategy" | "planRequired" | "active",
    value: string | boolean
  ) {
    setMessage("")
    setLoadingKey(`${id}:${field}`)

    try {
      const res = await fetch(`/api/phone-lines/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [field]: value }),
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setMessage(body.error || "Something went wrong.")
        return
      }

      setMessage("Phone line updated.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoadingKey("")
    }
  }

  async function saveRoutingTargets(
    event: React.FormEvent<HTMLFormElement>,
    id: string
  ) {
    event.preventDefault()
    setMessage("")
    setLoadingKey(`${id}:routeTargets`)

    const formData = new FormData(event.currentTarget)
    const routeTargets = getRouteTargetsFromForm(formData)

    if (routeTargets.length === 0) {
      setMessage("Add at least one routing phone.")
      setLoadingKey("")
      return
    }

    try {
      const res = await fetch(`/api/phone-lines/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ routeTargets }),
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setMessage(body.error || "Something went wrong.")
        return
      }

      setMessage("Routing phones updated.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoadingKey("")
    }
  }

  async function removeLine(id: string) {
    setMessage("")
    setLoadingKey(`${id}:delete`)

    try {
      const res = await fetch(`/api/phone-lines/${id}`, {
        method: "DELETE",
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setMessage(body.error || "Something went wrong.")
        return
      }

      setMessage("Phone line removed.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoadingKey("")
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.2fr]">
      <form
        onSubmit={submitForm}
        className="rounded-2xl border border-lr-border p-5"
      >
        <div>
          <h2 className="text-xl font-bold text-lr-strong">Add phone line</h2>
          <p className="mt-2 text-sm leading-6 text-lr-muted">
            Store the LeadReply number and where it forwards. Provider IDs can
            be filled in after Twilio production setup.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-lr-body">Label</span>
            <input
              name="label"
              className="mt-1 w-full rounded-xl border border-lr-border-strong px-4 py-3 text-sm"
              placeholder="Main line, sales, service, after hours"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-lr-body">
              LeadReply phone number
            </span>
            <input
              name="phoneNumber"
              required
              className="mt-1 w-full rounded-xl border border-lr-border-strong px-4 py-3 text-sm"
              placeholder="+1 555 000 1234"
            />
          </label>
          <div className="rounded-2xl bg-lr-surface-muted p-4">
            <p className="text-sm font-bold text-lr-strong">
              Call routing order
            </p>
            <p className="mt-1 text-xs font-semibold text-lr-muted">
              {selectedPlan} can try {routeTargetLimit} phone
              {routeTargetLimit === 1 ? "" : "s"} before LeadReply sends the
              automatic text.
            </p>
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((index) => {
                const enabled = index < routeTargetLimit

                return (
                  <div
                    key={index}
                    className={`grid gap-3 rounded-xl border p-3 sm:grid-cols-[0.8fr_1fr] ${
                      enabled
                        ? "border-lr-border bg-lr-surface"
                        : "border-lr-border bg-lr-hover opacity-60"
                    }`}
                  >
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wide text-lr-subtle">
                        {getPlanRouteLabel(index)}
                      </span>
                      <input
                        name={`routeTargetLabel${index}`}
                        disabled={!enabled}
                        defaultValue={index === 0 ? "Primary" : `Fallback ${index + 1}`}
                        className="mt-1 w-full rounded-xl border border-lr-border-strong px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wide text-lr-subtle">
                        Phone number
                      </span>
                      <input
                        name={`routeTargetPhone${index}`}
                        required={index === 0}
                        disabled={!enabled}
                        defaultValue={index === 0 ? defaultRoutingTarget : ""}
                        className="mt-1 w-full rounded-xl border border-lr-border-strong px-3 py-2 text-sm"
                        placeholder={
                          index === 0
                            ? "Owner or staff phone"
                            : "Optional fallback phone"
                        }
                      />
                    </label>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-lr-body">
                Routing mode
              </span>
              <select
                name="routingStrategy"
                className="mt-1 w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 text-sm"
              >
                {routingStrategies.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-lr-body">
                Plan needed
              </span>
              <select
                name="planRequired"
                defaultValue={selectedPlan}
                className="mt-1 w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 text-sm"
              >
                {planOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-semibold text-lr-body">
              Provider line ID
            </span>
            <input
              name="providerLineId"
              className="mt-1 w-full rounded-xl border border-lr-border-strong px-4 py-3 text-sm"
              placeholder="Optional Twilio SID or internal ID"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-lr-body">Notes</span>
            <textarea
              name="notes"
              rows={3}
              className="mt-1 w-full rounded-xl border border-lr-border-strong px-4 py-3 text-sm"
              placeholder="Routing notes, departments, hours, or setup details."
            />
          </label>
          <button
            type="submit"
            disabled={!canAddLine || loadingKey === "create"}
            className="w-full rounded-xl bg-lr-primary px-5 py-3 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingKey === "create" ? "Adding..." : "Add phone line"}
          </button>
          {!canAddLine && (
            <p className="text-sm font-semibold text-amber-700">
              This plan is at its current phone-line limit.
            </p>
          )}
          {message && <p className="text-sm font-semibold text-lr-muted">{message}</p>}
        </div>
      </form>

      <section className="rounded-2xl border border-lr-border p-5">
        <h2 className="text-xl font-bold text-lr-strong">Configured lines</h2>
        <div className="mt-5 space-y-3">
          {phoneLines.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-lr-border-strong bg-lr-surface-muted p-6">
              <p className="font-bold text-lr-strong">
                No LeadReply phone lines yet
              </p>
              <p className="mt-2 text-sm leading-6 text-lr-muted">
                Add the first line when you are ready to connect a client phone
                number or Twilio number.
              </p>
            </div>
          ) : (
            phoneLines.map((line) => {
              const lineRouteTargets = getLineRouteTargets(line)

              return (
                <article
                  key={line.id}
                  className="rounded-2xl border border-lr-border p-4"
                >
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-lr-strong">
                        {line.label || line.phoneNumber}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          line.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-lr-hover text-lr-muted"
                        }`}
                      >
                        {line.active ? "Active" : "Paused"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-lr-muted">
                      {line.phoneNumber} tries {lineRouteTargets
                        .filter((target) => target.phoneNumber)
                        .map((target) => target.phoneNumber)
                        .join(" then ")}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-lr-subtle">
                      Provider: {line.provider}
                      {line.providerLineId ? ` - ${line.providerLineId}` : ""}
                    </p>
                    {line.notes && (
                      <p className="mt-2 text-sm leading-6 text-lr-muted">
                        {line.notes}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={loadingKey === `${line.id}:delete`}
                    onClick={() => removeLine(line.id)}
                    className="rounded-xl border border-lr-border-strong px-3 py-2 text-sm font-bold text-lr-body hover:bg-lr-hover disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <select
                    value={line.routingStrategy}
                    onChange={(event) =>
                      updateLine(line.id, "routingStrategy", event.target.value)
                    }
                    className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-2 text-sm font-semibold text-lr-body"
                  >
                    {routingStrategies.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={line.planRequired}
                    onChange={(event) =>
                      updateLine(line.id, "planRequired", event.target.value)
                    }
                    className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-2 text-sm font-semibold text-lr-body"
                  >
                    {planOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={String(line.active)}
                    onChange={(event) =>
                      updateLine(line.id, "active", event.target.value === "true")
                    }
                    className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-2 text-sm font-semibold text-lr-body"
                  >
                    <option value="true">Active</option>
                    <option value="false">Paused</option>
                  </select>
                </div>
                <form
                  onSubmit={(event) => saveRoutingTargets(event, line.id)}
                  className="mt-4 rounded-2xl bg-lr-surface-muted p-4"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-sm font-bold text-lr-strong">
                        Fallback routing
                      </p>
                      <p className="mt-1 text-xs font-semibold text-lr-muted">
                        Twilio tries these in order. If nobody answers,
                        LeadReply texts the customer.
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={loadingKey === `${line.id}:routeTargets`}
                      className="rounded-xl bg-lr-primary px-4 py-2 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-50"
                    >
                      {loadingKey === `${line.id}:routeTargets`
                        ? "Saving..."
                        : "Save routing"}
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {[0, 1, 2].map((index) => {
                      const enabled = index < routeTargetLimit
                      const target = lineRouteTargets[index]

                      return (
                        <div
                          key={index}
                          className={`grid gap-3 rounded-xl border p-3 sm:grid-cols-[0.8fr_1fr] ${
                            enabled
                              ? "border-lr-border bg-lr-surface"
                              : "border-lr-border bg-lr-hover opacity-60"
                          }`}
                        >
                          <label className="block">
                            <span className="text-xs font-bold uppercase tracking-wide text-lr-subtle">
                              {getPlanRouteLabel(index)}
                            </span>
                            <input
                              name={`routeTargetLabel${index}`}
                              disabled={!enabled}
                              defaultValue={target.label}
                              className="mt-1 w-full rounded-xl border border-lr-border-strong px-3 py-2 text-sm"
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs font-bold uppercase tracking-wide text-lr-subtle">
                              Phone number
                            </span>
                            <input
                              name={`routeTargetPhone${index}`}
                              required={index === 0}
                              disabled={!enabled}
                              defaultValue={target.phoneNumber}
                              className="mt-1 w-full rounded-xl border border-lr-border-strong px-3 py-2 text-sm"
                              placeholder={
                                index === 0
                                  ? "Owner or staff phone"
                                  : "Optional fallback phone"
                              }
                            />
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </form>
              </article>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
