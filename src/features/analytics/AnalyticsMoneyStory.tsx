type AnalyticsMoneyStoryProps = {
  capturedRevenue: string
  recoveredRevenue: string
  openLeadValue: string
  closedLeadValue: string
  marketingRoi: string
  bestSourceLabel: string
  bestSourceRevenue: string
  conversionRate: number
  missedCallCaptureRate: number
  responseLabel: string
}

export function AnalyticsMoneyStory({
  capturedRevenue,
  recoveredRevenue,
  openLeadValue,
  closedLeadValue,
  marketingRoi,
  bestSourceLabel,
  bestSourceRevenue,
  conversionRate,
  missedCallCaptureRate,
  responseLabel,
}: AnalyticsMoneyStoryProps) {
  const storyItems = [
    {
      label: "Captured revenue",
      value: capturedRevenue,
      detail: `${conversionRate}% of leads converted in this view.`,
    },
    {
      label: "Recovered from missed calls",
      value: recoveredRevenue,
      detail: `${missedCallCaptureRate}% missed-call capture rate.`,
    },
    {
      label: "Still open",
      value: openLeadValue,
      detail: "Potential money waiting for follow-up.",
    },
    {
      label: "Closed work",
      value: closedLeadValue,
      detail: "No active follow-up is waiting on these leads.",
    },
  ]

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-lr-border bg-lr-primary text-lr-on-primary">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-300">
            Money story
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">
            LeadReply is showing what converted, what is still open, and what
            has been closed out.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-lr-on-primary/75">
            Best current source: {bestSourceLabel} at {bestSourceRevenue}.
            Marketing ROI after campaign costs is {marketingRoi}. Response
            speed is currently {responseLabel.toLowerCase()}.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {storyItems.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-lr-on-primary/75">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-black">{item.value}</p>
              <p className="mt-2 text-xs leading-5 text-lr-on-primary/75">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
