import { AnalyticsMetricCard } from "@/features/analytics/AnalyticsCharts"

type AnalyticsSummaryTone = "slate" | "emerald" | "sky" | "amber"

type AnalyticsSummaryCard = {
  label: string
  value: string | number
  detail: string
  tone?: AnalyticsSummaryTone
}

export function AnalyticsSummaryCards({
  cards,
}: {
  cards: AnalyticsSummaryCard[]
}) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <AnalyticsMetricCard
          key={card.label}
          label={card.label}
          value={card.value}
          detail={card.detail}
          tone={card.tone}
        />
      ))}
    </div>
  )
}
