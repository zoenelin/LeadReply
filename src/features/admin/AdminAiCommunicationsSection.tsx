import type { AdminOperationsDashboardData } from "@/services/admin/operations"
import { labelFromValue } from "@/services/admin/options"
import {
  Badge,
  EmptyState,
  formatDateTime,
  formatMoney,
  previewText,
} from "@/features/admin/admin-ui"

type AdminAiCommunicationsSectionProps = {
  aiUsageSummary: AdminOperationsDashboardData["aiUsageSummary"]
  aiUsageLogs: AdminOperationsDashboardData["aiUsageLogs"]
  smsMessages: AdminOperationsDashboardData["smsMessages"]
}

export function AdminAiCommunicationsSection({
  aiUsageSummary,
  aiUsageLogs,
  smsMessages,
}: AdminAiCommunicationsSectionProps) {
  return (
    <section id="ai" className="mt-8 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6">
        <p className="text-sm font-bold uppercase tracking-wide text-lr-subtle">
          AI
        </p>
        <h2 className="mt-2 text-2xl font-black text-lr-strong">
          Usage and cost tracking
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-lr-surface-muted p-4">
            <p className="text-sm text-lr-subtle">Input tokens</p>
            <p className="mt-1 text-2xl font-black text-lr-strong">
              {aiUsageSummary.inputTokens}
            </p>
          </div>
          <div className="rounded-2xl bg-lr-surface-muted p-4">
            <p className="text-sm text-lr-subtle">Output tokens</p>
            <p className="mt-1 text-2xl font-black text-lr-strong">
              {aiUsageSummary.outputTokens}
            </p>
          </div>
          <div className="rounded-2xl bg-lr-surface-muted p-4">
            <p className="text-sm text-lr-subtle">Cost</p>
            <p className="mt-1 text-2xl font-black text-lr-strong">
              {formatMoney(aiUsageSummary.estimatedCostCents)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-lr-border bg-lr-surface p-5 shadow-sm shadow-lr-shadow/30 sm:p-6">
        <h2 className="text-xl font-black text-lr-strong">
          Recent AI events
        </h2>
        <div className="mt-5 space-y-3">
          {aiUsageLogs.length === 0 ? (
            <EmptyState message="No AI usage has been logged yet." />
          ) : (
            aiUsageLogs.map((log) => (
              <div
                key={log.id}
                className="grid gap-3 rounded-2xl border border-lr-border p-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <p className="font-black text-lr-strong">
                    {labelFromValue(log.feature)}
                  </p>
                  <p className="mt-1 text-sm text-lr-muted">
                    {log.business?.name || "No client"} -{" "}
                    {log.model || log.provider}
                  </p>
                </div>
                <div className="text-sm font-semibold text-lr-muted sm:text-right">
                  <p>{log.inputTokens + log.outputTokens} tokens</p>
                  <p>{formatMoney(log.estimatedCostCents)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 border-t border-lr-border pt-5">
          <h3 className="text-xl font-black text-lr-strong">
            Recent SMS events
          </h3>
          <div className="mt-4 space-y-3">
            {smsMessages.length === 0 ? (
              <EmptyState message="No SMS events yet." />
            ) : (
              smsMessages.map((sms) => (
                <div
                  key={sms.id}
                  className="rounded-2xl border border-lr-border p-4"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div>
                      <p className="font-black text-lr-strong">
                        {sms.direction === "INBOUND"
                          ? "Customer reply"
                          : "LeadReply text"}{" "}
                        {sms.missedCall?.callerName
                          ? `- ${sms.missedCall.callerName}`
                          : ""}
                      </p>
                      <p className="mt-1 text-sm text-lr-muted">
                        {sms.business?.name || "No client"} -{" "}
                        {formatDateTime(sms.createdAt)}
                      </p>
                    </div>
                    <Badge value={sms.status} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-lr-body">
                    {previewText(sms.body)}
                  </p>
                  {sms.error && (
                    <p className="mt-2 text-sm font-medium text-rose-700">
                      {sms.error}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
