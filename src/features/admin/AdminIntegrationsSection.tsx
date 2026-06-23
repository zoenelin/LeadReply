import type { AdminOperationsDashboardData } from "@/services/admin/operations"
import { Badge, EmptyState } from "@/features/admin/admin-ui"

type AdminIntegrationsSectionProps = {
  integrationStatuses: AdminOperationsDashboardData["integrationStatuses"]
  emailLogs: AdminOperationsDashboardData["emailLogs"]
}

export function AdminIntegrationsSection({
  integrationStatuses,
  emailLogs,
}: AdminIntegrationsSectionProps) {
  return (
    <section
      id="integrations"
      className="mt-8 grid gap-5 xl:grid-cols-[1fr_1fr]"
    >
      <div className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6">
        <p className="text-sm font-bold uppercase tracking-wide text-lr-subtle">
          Integrations
        </p>
        <h2 className="mt-2 text-2xl font-black text-lr-strong">
          Provider health
        </h2>
        <div className="mt-6 grid gap-3">
          {integrationStatuses.map((status) => (
            <div
              key={status.key}
              className="rounded-2xl border border-lr-border p-4"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <p className="font-black text-lr-strong">{status.label}</p>
                  <p className="mt-1 text-sm leading-6 text-lr-muted">
                    {status.summary}
                  </p>
                </div>
                <Badge value={status.configured ? "ACTIVE" : "BLOCKED"} />
              </div>
              {status.missing.length > 0 && (
                <p className="mt-3 text-xs font-semibold text-amber-700">
                  Missing: {status.missing.join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6">
        <h2 className="text-xl font-black text-lr-strong">
          Email and system events
        </h2>
        <div className="mt-5 space-y-3">
          {emailLogs.length === 0 ? (
            <EmptyState message="No email events yet." />
          ) : (
            emailLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-lr-border p-4"
              >
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <div>
                    <p className="font-black text-lr-strong">{log.subject}</p>
                    <p className="mt-1 text-sm text-lr-muted">
                      {log.to} -{" "}
                      {log.business?.name || log.user?.email || "No client"}
                    </p>
                  </div>
                  <Badge value={log.status} />
                </div>
                {log.error && (
                  <p className="mt-2 text-sm font-medium text-rose-700">
                    {log.error}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
