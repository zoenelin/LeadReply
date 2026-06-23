import type { FormEvent } from "react"
import type { AdminOperationsDashboardData } from "@/services/admin/operations"
import { labelFromValue, opsJobKinds, opsJobStatuses } from "@/services/admin/options"
import {
  Badge,
  EmptyState,
  Field,
  formatDate,
  InlineSelect,
  SelectField,
} from "@/features/admin/admin-ui"

type AdminMutate = (
  path: string,
  payload: Record<string, unknown>,
  method?: "POST" | "PATCH",
  loadingLabel?: string
) => Promise<boolean>

type AdminJobsSectionProps = {
  businesses: AdminOperationsDashboardData["businesses"]
  opsJobs: AdminOperationsDashboardData["opsJobs"]
  loading: boolean
  mutate: AdminMutate
  submitForm: (
    event: FormEvent<HTMLFormElement>,
    path: string,
    successMessage: string
  ) => void | Promise<void>
}

export function AdminJobsSection({
  businesses,
  opsJobs,
  loading,
  mutate,
  submitForm,
}: AdminJobsSectionProps) {
  return (
    <section
      id="jobs"
      className="mt-8 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]"
    >
      <form
        onSubmit={(event) =>
          void submitForm(event, "/api/admin/job-runs", "Job queued.")
        }
        className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6"
      >
        <p className="text-sm font-bold uppercase tracking-wide text-lr-subtle">
          Jobs
        </p>
        <h2 className="mt-2 text-2xl font-black text-lr-strong">
          Queue manual job
        </h2>
        <div className="mt-5 space-y-4">
          <Field label="Client">
            <select
              name="businessId"
              className="w-full rounded-xl border border-lr-border-strong bg-lr-surface px-3 py-3 text-sm"
            >
              <option value="">No client</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Name">
            <input
              name="name"
              required
              className="w-full rounded-xl border border-lr-border-strong px-3 py-3 text-sm"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kind">
              <SelectField name="kind" options={opsJobKinds} />
            </Field>
            <Field label="Status">
              <SelectField
                name="status"
                defaultValue="QUEUED"
                options={opsJobStatuses}
              />
            </Field>
          </div>
          <Field label="Scheduled">
            <input
              name="scheduledFor"
              type="datetime-local"
              className="w-full rounded-xl border border-lr-border-strong px-3 py-3 text-sm"
            />
          </Field>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-lr-subtle">
              Details
            </span>
            <textarea
              name="details"
              rows={4}
              className="mt-2 w-full rounded-xl border border-lr-border-strong px-3 py-3 text-sm"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-5 rounded-xl bg-lr-primary px-4 py-3 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
        >
          Queue job
        </button>
      </form>

      <div className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6">
        <h2 className="text-xl font-black text-lr-strong">
          Background job status
        </h2>
        <div className="mt-5 space-y-3">
          {opsJobs.length === 0 ? (
            <EmptyState message="No jobs have been recorded yet." />
          ) : (
            opsJobs.map((job) => (
              <article
                key={job.id}
                className="rounded-2xl border border-lr-border p-4"
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_13rem] lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-lr-strong">
                        {job.name}
                      </h3>
                      <Badge value={job.status} />
                    </div>
                    <p className="mt-1 text-sm text-lr-muted">
                      {labelFromValue(job.kind)} -{" "}
                      {job.business?.name || "No client"}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-lr-subtle">
                      Queue {job.queueName || "manual"} - attempts{" "}
                      {job.attemptsMade}/{job.maxAttempts}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-lr-subtle">
                      Queued {formatDate(job.queuedAt)} - scheduled{" "}
                      {formatDate(job.scheduledFor)}
                    </p>
                    {job.details && (
                      <p className="mt-2 text-sm text-lr-muted">
                        {job.details}
                      </p>
                    )}
                    {job.error && (
                      <p className="mt-2 text-sm font-medium text-rose-700">
                        {job.error}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <InlineSelect
                      label={`Status for ${job.name}`}
                      value={job.status}
                      options={opsJobStatuses}
                      onChange={(value) =>
                        void mutate(
                          `/api/admin/job-runs/${job.id}`,
                          { status: value },
                          "PATCH",
                          "Job updated."
                        )
                      }
                    />
                    {["FAILED", "CANCELLED"].includes(job.status) && (
                      <button
                        type="button"
                        onClick={() =>
                          void mutate(
                            `/api/admin/job-runs/${job.id}/retry`,
                            {},
                            "POST",
                            "Job retried."
                          )
                        }
                        className="rounded-xl bg-lr-primary px-3 py-2 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover"
                      >
                        Retry
                      </button>
                    )}
                    {["PLANNED", "QUEUED", "RETRYING"].includes(
                      job.status
                    ) && (
                      <button
                        type="button"
                        onClick={() =>
                          void mutate(
                            `/api/admin/job-runs/${job.id}/cancel`,
                            {},
                            "POST",
                            "Job cancelled."
                          )
                        }
                        className="rounded-xl border border-lr-border-strong px-3 py-2 text-sm font-bold text-lr-body hover:bg-lr-hover"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
