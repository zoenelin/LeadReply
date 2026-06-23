"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { centsToDollars } from "@/lib/domain/lead-options"
import {
  dayOptions,
  formatAvailabilityWindow,
  formatDuration,
  formatServiceEstimate,
  type AvailabilityWindowItem,
  type ServiceCatalogItem,
} from "@/lib/domain/service-catalog"

type ServiceCatalogFormProps = {
  services: (ServiceCatalogItem & {
    displayOrder: number
  })[]
  availabilityWindows: (AvailabilityWindowItem & {
    id: string
  })[]
}

type ServiceFormValues = {
  name: string
  description: string
  category: string
  estimateLow: string
  estimateHigh: string
  durationMinutes: string
  bookableOnline: boolean
  ownerConfirmRequired: boolean
  active: boolean
}

type AvailabilityFormValues = {
  dayOfWeek: string
  startTime: string
  endTime: string
  minimumNoticeHours: string
  active: boolean
}

function emptyServiceForm(): ServiceFormValues {
  return {
    name: "",
    description: "",
    category: "",
    estimateLow: "",
    estimateHigh: "",
    durationMinutes: "60",
    bookableOnline: false,
    ownerConfirmRequired: true,
    active: true,
  }
}

function serviceToForm(service: ServiceCatalogFormProps["services"][number]) {
  return {
    name: service.name,
    description: service.description,
    category: service.category,
    estimateLow: centsToDollars(service.estimateLowCents),
    estimateHigh: centsToDollars(service.estimateHighCents),
    durationMinutes: String(service.durationMinutes),
    bookableOnline: service.bookableOnline,
    ownerConfirmRequired: service.ownerConfirmRequired,
    active: service.active,
  }
}

function emptyAvailabilityForm(): AvailabilityFormValues {
  return {
    dayOfWeek: "1",
    startTime: "09:00",
    endTime: "17:00",
    minimumNoticeHours: "4",
    active: true,
  }
}

function availabilityToForm(
  window: ServiceCatalogFormProps["availabilityWindows"][number]
) {
  return {
    dayOfWeek: String(window.dayOfWeek),
    startTime: window.startTime,
    endTime: window.endTime,
    minimumNoticeHours: String(window.minimumNoticeHours),
    active: window.active,
  }
}

export function ServiceCatalogForm({
  services,
  availabilityWindows,
}: ServiceCatalogFormProps) {
  const router = useRouter()
  const [serviceForm, setServiceForm] = useState(emptyServiceForm())
  const [availabilityForm, setAvailabilityForm] = useState(
    emptyAvailabilityForm()
  )
  const [editingServiceId, setEditingServiceId] = useState("")
  const [editingAvailabilityId, setEditingAvailabilityId] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const activeServices = useMemo(
    () => services.filter((service) => service.active),
    [services]
  )
  const activeWindows = useMemo(
    () => availabilityWindows.filter((window) => window.active),
    [availabilityWindows]
  )

  function updateServiceForm<K extends keyof ServiceFormValues>(
    field: K,
    value: ServiceFormValues[K]
  ) {
    setServiceForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  function updateAvailabilityForm<K extends keyof AvailabilityFormValues>(
    field: K,
    value: AvailabilityFormValues[K]
  ) {
    setAvailabilityForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  async function saveService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch(
        editingServiceId ? `/api/services/${editingServiceId}` : "/api/services",
        {
          method: editingServiceId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...serviceForm,
            durationMinutes: Number(serviceForm.durationMinutes),
          }),
        }
      )
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setServiceForm(emptyServiceForm())
      setEditingServiceId("")
      setMessage(editingServiceId ? "Service updated." : "Service added.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function deleteService(id: string) {
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      if (editingServiceId === id) {
        setServiceForm(emptyServiceForm())
        setEditingServiceId("")
      }
      setMessage("Service deleted.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function saveAvailability(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch(
        editingAvailabilityId
          ? `/api/availability-windows/${editingAvailabilityId}`
          : "/api/availability-windows",
        {
          method: editingAvailabilityId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...availabilityForm,
            dayOfWeek: Number(availabilityForm.dayOfWeek),
            minimumNoticeHours: Number(availabilityForm.minimumNoticeHours),
          }),
        }
      )
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setAvailabilityForm(emptyAvailabilityForm())
      setEditingAvailabilityId("")
      setMessage(
        editingAvailabilityId ? "Availability updated." : "Availability added."
      )
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function deleteAvailability(id: string) {
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch(`/api/availability-windows/${id}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      if (editingAvailabilityId === id) {
        setAvailabilityForm(emptyAvailabilityForm())
        setEditingAvailabilityId("")
      }
      setMessage("Availability deleted.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function addIndustryPresets() {
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/services/presets", {
        method: "POST",
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage(
        `Added ${data.addedServices} service preset${
          data.addedServices === 1 ? "" : "s"
        } and ${data.addedAvailabilityWindows} availability window${
          data.addedAvailabilityWindows === 1 ? "" : "s"
        }.`
      )
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-800">
              Industry presets
            </p>
            <h2 className="mt-2 text-xl font-bold text-lr-strong">
              Add starter services for this business type
            </h2>
            <p className="mt-2 text-sm text-lr-body">
              Presets give the LeadReply missed-call assistant clean examples for matching quote
              and scheduling requests.
            </p>
          </div>
          <button
            type="button"
            onClick={addIndustryPresets}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl bg-lr-surface px-4 py-3 text-sm font-semibold text-lr-strong shadow-sm hover:bg-sky-100 disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add presets"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-lr-border p-5">
          <p className="text-sm text-lr-subtle">Active services</p>
          <p className="mt-2 text-3xl font-bold text-lr-strong">
            {activeServices.length}
          </p>
        </div>
        <div className="rounded-2xl border border-lr-border p-5">
          <p className="text-sm text-lr-subtle">Bookable services</p>
          <p className="mt-2 text-3xl font-bold text-lr-strong">
            {
              activeServices.filter(
                (service) =>
                  service.bookableOnline && !service.ownerConfirmRequired
              ).length
            }
          </p>
        </div>
        <div className="rounded-2xl border border-lr-border p-5">
          <p className="text-sm text-lr-subtle">Availability windows</p>
          <p className="mt-2 text-3xl font-bold text-lr-strong">
            {activeWindows.length}
          </p>
        </div>
      </div>

      <form
        onSubmit={saveService}
        className="rounded-2xl border border-lr-border p-5"
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-xl font-bold text-lr-strong">
              {editingServiceId ? "Edit service" : "Add service"}
            </h2>
            <p className="mt-2 text-sm text-lr-muted">
              Services give the missed-call assistant a clean way to match requests,
              estimate ranges, durations, and booking rules.
            </p>
          </div>
          {editingServiceId && (
            <button
              type="button"
              onClick={() => {
                setEditingServiceId("")
                setServiceForm(emptyServiceForm())
              }}
              className="rounded-xl border border-lr-border-strong px-4 py-3 text-sm font-semibold text-lr-strong hover:bg-lr-hover"
            >
              Cancel edit
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Service name
            </label>
            <input
              type="text"
              value={serviceForm.name}
              onChange={(e) => updateServiceForm("name", e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="Brake pad service"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <input
              type="text"
              value={serviceForm.category}
              onChange={(e) => updateServiceForm("category", e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="Repair, consultation, reservation"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            value={serviceForm.description}
            onChange={(e) => updateServiceForm("description", e.target.value)}
            className="min-h-24 w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
            placeholder="Keywords customers might use, requirements, or owner notes."
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Low estimate
            </label>
            <input
              type="number"
              min="0"
              value={serviceForm.estimateLow}
              onChange={(e) => updateServiceForm("estimateLow", e.target.value)}
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="250"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              High estimate
            </label>
            <input
              type="number"
              min="0"
              value={serviceForm.estimateHigh}
              onChange={(e) =>
                updateServiceForm("estimateHigh", e.target.value)
              }
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              placeholder="450"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Duration</label>
            <input
              type="number"
              min="5"
              max="1440"
              value={serviceForm.durationMinutes}
              onChange={(e) =>
                updateServiceForm("durationMinutes", e.target.value)
              }
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              required
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="flex items-start gap-3 rounded-xl bg-lr-surface-muted p-4">
            <input
              type="checkbox"
              checked={serviceForm.bookableOnline}
              onChange={(e) =>
                updateServiceForm("bookableOnline", e.target.checked)
              }
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block text-sm font-semibold text-lr-strong">
                Bookable
              </span>
              <span className="mt-1 block text-xs text-lr-muted">
                Can use connected schedule later.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-xl bg-lr-surface-muted p-4">
            <input
              type="checkbox"
              checked={serviceForm.ownerConfirmRequired}
              onChange={(e) =>
                updateServiceForm("ownerConfirmRequired", e.target.checked)
              }
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block text-sm font-semibold text-lr-strong">
                Owner confirms
              </span>
              <span className="mt-1 block text-xs text-lr-muted">
                Prevent automatic promises.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-xl bg-lr-surface-muted p-4">
            <input
              type="checkbox"
              checked={serviceForm.active}
              onChange={(e) => updateServiceForm("active", e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block text-sm font-semibold text-lr-strong">
                Active
              </span>
              <span className="mt-1 block text-xs text-lr-muted">
                Available for matching.
              </span>
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-lr-primary px-5 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
        >
          {loading
            ? "Saving..."
            : editingServiceId
              ? "Save service"
              : "Add service"}
        </button>
      </form>

      <section className="rounded-2xl border border-lr-border p-5">
        <h2 className="text-xl font-bold text-lr-strong">Service catalog</h2>
        <div className="mt-5 space-y-3">
          {services.length === 0 ? (
            <div className="rounded-xl border border-dashed border-lr-border-strong p-6 text-center">
              <p className="font-semibold text-lr-strong">
                No services configured yet.
              </p>
              <p className="mt-2 text-sm text-lr-muted">
                Add the services customers ask about most often.
              </p>
            </div>
          ) : (
            services.map((service) => (
              <article
                key={service.id}
                className="rounded-xl border border-lr-border p-4"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-lr-strong">
                        {service.name}
                      </h3>
                      <span className="rounded-lg bg-lr-hover px-2 py-1 text-xs font-bold text-lr-body">
                        {service.active ? "Active" : "Paused"}
                      </span>
                      <span className="rounded-lg bg-lr-hover px-2 py-1 text-xs font-bold text-lr-body">
                        {service.bookableOnline &&
                        !service.ownerConfirmRequired
                          ? "Bookable"
                          : "Owner confirm"}
                      </span>
                    </div>
                    {service.description && (
                      <p className="mt-2 text-sm text-lr-muted">
                        {service.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-lr-body">
                      <span className="rounded-lg bg-lr-surface-muted px-3 py-1">
                        {formatServiceEstimate(service)}
                      </span>
                      <span className="rounded-lg bg-lr-surface-muted px-3 py-1">
                        {formatDuration(service.durationMinutes)}
                      </span>
                      {service.category && (
                        <span className="rounded-lg bg-lr-surface-muted px-3 py-1">
                          {service.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingServiceId(service.id)
                        setServiceForm(serviceToForm(service))
                      }}
                      className="rounded-lg border border-lr-border-strong px-3 py-2 text-xs font-semibold text-lr-body hover:bg-lr-hover"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteService(service.id)}
                      className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <form
        onSubmit={saveAvailability}
        className="rounded-2xl border border-lr-border p-5"
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-xl font-bold text-lr-strong">
              {editingAvailabilityId ? "Edit availability" : "Add availability"}
            </h2>
            <p className="mt-2 text-sm text-lr-muted">
              These windows tell the missed-call assistant what hours can be offered or
              checked later when calendar integrations are connected.
            </p>
          </div>
          {editingAvailabilityId && (
            <button
              type="button"
              onClick={() => {
                setEditingAvailabilityId("")
                setAvailabilityForm(emptyAvailabilityForm())
              }}
              className="rounded-xl border border-lr-border-strong px-4 py-3 text-sm font-semibold text-lr-strong hover:bg-lr-hover"
            >
              Cancel edit
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Day</label>
            <select
              value={availabilityForm.dayOfWeek}
              onChange={(e) =>
                updateAvailabilityForm("dayOfWeek", e.target.value)
              }
              className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-4 py-3 outline-none focus:border-lr-strong"
            >
              {dayOptions.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Start</label>
            <input
              type="time"
              value={availabilityForm.startTime}
              onChange={(e) =>
                updateAvailabilityForm("startTime", e.target.value)
              }
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">End</label>
            <input
              type="time"
              value={availabilityForm.endTime}
              onChange={(e) =>
                updateAvailabilityForm("endTime", e.target.value)
              }
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Notice hours
            </label>
            <input
              type="number"
              min="0"
              max="168"
              value={availabilityForm.minimumNoticeHours}
              onChange={(e) =>
                updateAvailabilityForm("minimumNoticeHours", e.target.value)
              }
              className="w-full rounded-xl border border-lr-border-strong px-4 py-3 outline-none focus:border-lr-strong"
              required
            />
          </div>
        </div>

        <label className="mt-4 flex items-start gap-3 rounded-xl bg-lr-surface-muted p-4">
          <input
            type="checkbox"
            checked={availabilityForm.active}
            onChange={(e) =>
              updateAvailabilityForm("active", e.target.checked)
            }
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="block text-sm font-semibold text-lr-strong">
              Active window
            </span>
            <span className="mt-1 block text-xs text-lr-muted">
              Include this window in missed-call assistant guidance.
            </span>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-lr-primary px-5 py-3 text-sm font-semibold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
        >
          {loading
            ? "Saving..."
            : editingAvailabilityId
              ? "Save availability"
              : "Add availability"}
        </button>
      </form>

      <section className="rounded-2xl border border-lr-border p-5">
        <h2 className="text-xl font-bold text-lr-strong">
          Weekly availability
        </h2>
        <div className="mt-5 space-y-3">
          {availabilityWindows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-lr-border-strong p-6 text-center">
              <p className="font-semibold text-lr-strong">
                No availability windows yet.
              </p>
              <p className="mt-2 text-sm text-lr-muted">
                Add at least one window so booking guidance is useful.
              </p>
            </div>
          ) : (
            availabilityWindows.map((window) => (
              <article
                key={window.id}
                className="rounded-xl border border-lr-border p-4"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-lr-strong">
                        {formatAvailabilityWindow(window)}
                      </p>
                      <span className="rounded-lg bg-lr-hover px-2 py-1 text-xs font-bold text-lr-body">
                        {window.active ? "Active" : "Paused"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-lr-muted">
                      Minimum notice: {window.minimumNoticeHours} hour
                      {window.minimumNoticeHours === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAvailabilityId(window.id)
                        setAvailabilityForm(availabilityToForm(window))
                      }}
                      className="rounded-lg border border-lr-border-strong px-3 py-2 text-xs font-semibold text-lr-body hover:bg-lr-hover"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAvailability(window.id)}
                      className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <div className="rounded-2xl border border-lr-border bg-lr-surface-muted p-5">
        <p className="text-sm font-medium text-lr-subtle">
          Current quote coverage
        </p>
        <p className="mt-2 text-lg font-bold text-lr-strong">
          {activeServices.filter((service) => service.estimateLowCents > 0).length}{" "}
          of {activeServices.length} active services include a starting estimate.
        </p>
        <p className="mt-2 text-sm text-lr-muted">
          Estimate ranges stay internal review rules unless quote estimates are
          enabled in automation settings.
        </p>
        {activeServices.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {activeServices.slice(0, 4).map((service) => (
              <div key={service.id} className="rounded-xl bg-lr-surface p-4">
                <p className="font-semibold text-lr-strong">{service.name}</p>
                <p className="mt-1 text-sm text-lr-muted">
                  {formatServiceEstimate(service)} -{" "}
                  {formatDuration(service.durationMinutes)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {message && <p className="text-sm text-lr-muted">{message}</p>}
    </div>
  )
}
