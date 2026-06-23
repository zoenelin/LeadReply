"use client"

import { useState } from "react"

type MonthlyTrendRow = {
  key: string
  label: string
  leads: number
  revenueCents: number
}

type SourcePerformanceRow = {
  source: string
  label: string
  leadCount: number
  capturedCount: number
  conversionRate: number
  revenueCents: number
  campaignCostCents: number
  roiCents: number
  openLeadValueCents: number
  closedLeadValueCents: number
}

type StatusRow = {
  status: string
  label: string
  count: number
}

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

function formatMoneyValue(cents: number) {
  return moneyFormatter.format(cents / 100)
}

function clampPercent(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0
  }

  return Math.min(100, Math.max(4, value))
}

type ChartPoint = {
  x: number
  y: number
}

function createSmoothPath(points: ChartPoint[]) {
  if (points.length === 0) {
    return ""
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`
  }

  return points.reduce((path, point, index, allPoints) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`
    }

    const previous = allPoints[index - 1]
    const middleX = (previous.x + point.x) / 2

    return `${path} C ${middleX} ${previous.y}, ${middleX} ${point.y}, ${point.x} ${point.y}`
  }, "")
}

function createAreaPath(points: ChartPoint[], baselineY: number) {
  if (points.length === 0) {
    return ""
  }

  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]

  return `${createSmoothPath(points)} L ${lastPoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`
}

export function AnalyticsMetricCard({
  label,
  value,
  detail,
  tone = "slate",
}: {
  label: string
  value: string | number
  detail: string
  tone?: "slate" | "emerald" | "sky" | "amber"
}) {
  const toneClassNames = {
    slate: "border-lr-border bg-lr-surface",
    emerald: "border-emerald-400/30 bg-emerald-500/10",
    sky: "border-sky-400/30 bg-sky-500/10",
    amber: "border-amber-400/30 bg-amber-500/10",
  }

  return (
    <div className={`rounded-2xl border p-5 ${toneClassNames[tone]}`}>
      <p className="text-sm font-medium text-lr-subtle">{label}</p>
      <p className="mt-2 text-3xl font-bold text-lr-strong">{value}</p>
      <p className="mt-2 text-sm text-lr-muted">{detail}</p>
    </div>
  )
}

export function RevenueTrendChart({
  months,
}: {
  months: MonthlyTrendRow[]
}) {
  const [mode, setMode] = useState<"line" | "bar">("line")
  const chartMonths =
    months.length > 0
      ? months
      : [{ key: "empty", label: "Now", leads: 0, revenueCents: 0 }]
  const chartWidth = 760
  const chartHeight = 318
  const plotX = 54
  const plotY = 34
  const plotWidth = 652
  const plotHeight = 166
  const baselineY = plotY + plotHeight
  const leadBarBaseY = 246
  const leadBarMaxHeight = 38
  const labelY = 284
  const maxLeads = Math.max(...chartMonths.map((month) => month.leads), 1)
  const maxRevenue = Math.max(
    ...chartMonths.map((month) => month.revenueCents),
    1
  )
  const stepWidth =
    chartMonths.length > 1 ? plotWidth / (chartMonths.length - 1) : 0
  const groupWidth = plotWidth / Math.max(chartMonths.length, 1)
  const barWidth = Math.min(54, Math.max(22, groupWidth * 0.48))
  const totalRevenueCents = chartMonths.reduce(
    (total, month) => total + month.revenueCents,
    0
  )
  const totalLeads = chartMonths.reduce((total, month) => total + month.leads, 0)
  const latestRevenueCents =
    chartMonths[chartMonths.length - 1]?.revenueCents ?? 0
  const previousRevenueCents =
    chartMonths[chartMonths.length - 2]?.revenueCents ?? latestRevenueCents
  const revenueChangeCents = latestRevenueCents - previousRevenueCents
  const revenueChangeLabel =
    revenueChangeCents === 0
      ? "No change from last month"
      : `${revenueChangeCents > 0 ? "+" : ""}${formatMoneyValue(
          revenueChangeCents
        )} from last month`
  const revenuePoints = chartMonths.map((month, index) => {
    const x =
      chartMonths.length === 1
        ? plotX + plotWidth / 2
        : plotX + stepWidth * index
    const y =
      baselineY - (month.revenueCents / maxRevenue) * plotHeight

    return { x, y }
  })
  const revenuePath = createSmoothPath(revenuePoints)
  const revenueAreaPath = createAreaPath(revenuePoints, baselineY)
  const latestPoint = revenuePoints[revenuePoints.length - 1]
  const latestMonth = chartMonths[chartMonths.length - 1]
  const latestCardX = latestPoint
    ? Math.min(chartWidth - 142, Math.max(12, latestPoint.x - 70))
    : 12
  const latestCardY = latestPoint ? Math.max(12, latestPoint.y - 52) : 12

  return (
    <div className="rounded-2xl border border-lr-border bg-lr-surface-raised p-5 shadow-sm shadow-lr-shadow/30">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-medium text-lr-subtle">
            Money made trend
          </p>
          <h2 className="mt-1 text-2xl font-black text-lr-strong">
            {formatMoneyValue(totalRevenueCents)} over 6 months
          </h2>
          <p className="mt-2 text-sm font-medium text-lr-muted">
            {totalLeads} lead{totalLeads === 1 ? "" : "s"} tracked.{" "}
            {revenueChangeLabel}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-lr-muted">
          <div className="flex items-center gap-3 rounded-xl border border-lr-border bg-lr-surface-muted px-3 py-2">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-lr-sky" />
              Money made
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-lr-accent" />
              Leads
            </span>
          </div>
          <div className="inline-flex rounded-xl border border-lr-border bg-lr-surface-muted p-1">
            {(["line", "bar"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  mode === option
                    ? "bg-lr-primary text-lr-on-primary"
                    : "text-lr-muted hover:bg-lr-surface"
                  }`}
              >
                {option === "line" ? "Line" : "Bars"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-lr-border bg-lr-surface-muted">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          role="img"
          aria-label="Six month money made and lead volume chart"
          className="h-auto w-full"
        >
          <defs>
            <linearGradient id="money-area-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--lr-sky)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--lr-sky)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="money-bar-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--lr-sky)" stopOpacity="0.95" />
              <stop
                offset="100%"
                stopColor="var(--lr-primary)"
                stopOpacity="0.78"
              />
            </linearGradient>
          </defs>
          <rect
            width={chartWidth}
            height={chartHeight}
            fill="var(--lr-surface-muted)"
          />
          {[0, 1, 2].map((line) => {
            const y = plotY + (plotHeight / 2) * line

            return (
              <line
                key={line}
                x1={plotX}
                x2={plotX + plotWidth}
                y1={y}
                y2={y}
                stroke="var(--lr-border)"
                strokeWidth="1"
              />
            )
          })}
          {mode === "bar" ? (
            chartMonths.map((month, index) => {
              const point = revenuePoints[index]
              const revenueHeight = Math.max(2, baselineY - point.y)
              const revenueY = baselineY - revenueHeight
              const leadHeight =
                month.leads === 0
                  ? 2
                  : Math.max(6, (month.leads / maxLeads) * leadBarMaxHeight)

              return (
                <g key={month.key}>
                  <rect
                    x={point.x - barWidth / 2}
                    y={revenueY}
                    width={barWidth}
                    height={revenueHeight}
                    rx="9"
                    fill="url(#money-bar-gradient)"
                  />
                  <rect
                    x={point.x - 5}
                    y={leadBarBaseY - leadHeight}
                    width="10"
                    height={leadHeight}
                    rx="5"
                    fill="var(--lr-accent)"
                    opacity="0.75"
                  />
                  <text
                    x={point.x}
                    y={labelY}
                    textAnchor="middle"
                    className="fill-lr-subtle text-[12px] font-semibold"
                  >
                    {month.label}
                  </text>
                </g>
              )
            })
          ) : (
            <>
              <path d={revenueAreaPath} fill="url(#money-area-gradient)" />
              <path
                d={revenuePath}
                fill="none"
                stroke="var(--lr-sky)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="5"
              />
              {revenuePoints.map((point, index) => {
                const month = chartMonths[index]
                const leadHeight =
                  month.leads === 0
                    ? 2
                    : Math.max(6, (month.leads / maxLeads) * leadBarMaxHeight)

                return (
                  <g key={`trend-${month.key}`}>
                    <rect
                      x={point.x - 4}
                      y={leadBarBaseY - leadHeight}
                      width="8"
                      height={leadHeight}
                      rx="4"
                      fill="var(--lr-accent)"
                      opacity="0.72"
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="6"
                      fill="var(--lr-surface-muted)"
                      stroke="var(--lr-sky)"
                      strokeWidth="4"
                    />
                    <text
                      x={point.x}
                      y={labelY}
                      textAnchor="middle"
                      className="fill-lr-subtle text-[12px] font-semibold"
                    >
                      {month.label}
                    </text>
                  </g>
                )
              })}
            </>
          )}
          <line
            x1={plotX}
            x2={plotX + plotWidth}
            y1={baselineY}
            y2={baselineY}
            stroke="var(--lr-border-strong)"
            strokeWidth="1"
          />
          {latestPoint && latestMonth && (
            <g>
              <line
                x1={latestPoint.x}
                x2={latestPoint.x}
                y1={plotY}
                y2={leadBarBaseY}
                stroke="var(--lr-border)"
                strokeDasharray="4 8"
                strokeWidth="1"
              />
              <rect
                x={latestCardX}
                y={latestCardY}
                width="140"
                height="38"
                rx="10"
                fill="var(--lr-surface)"
                stroke="var(--lr-border)"
              />
              <text
                x={latestCardX + 70}
                y={latestCardY + 16}
                textAnchor="middle"
                className="fill-lr-strong text-[13px] font-bold"
              >
                {formatMoneyValue(latestMonth.revenueCents)}
              </text>
              <text
                x={latestCardX + 70}
                y={latestCardY + 31}
                textAnchor="middle"
                className="fill-lr-subtle text-[10px] font-semibold"
              >
                latest month
              </text>
            </g>
          )}
          <g>
            <text
              x={plotX}
              y={leadBarBaseY + 26}
              className="fill-lr-subtle text-[11px] font-semibold"
            >
              Lead activity
            </text>
            <text
              x={plotX + plotWidth}
              y={leadBarBaseY + 26}
              textAnchor="end"
              className="fill-lr-subtle text-[11px] font-semibold"
            >
              {formatMoneyValue(maxRevenue)} high point
            </text>
          </g>
        </svg>
      </div>
    </div>
  )
}

export function SourcePerformancePanel({
  rows,
}: {
  rows: SourcePerformanceRow[]
}) {
  const sortedRows = [...rows].sort(
    (left, right) =>
      right.revenueCents - left.revenueCents ||
      right.leadCount - left.leadCount
  )
  const maxRevenue = Math.max(...sortedRows.map((row) => row.revenueCents), 1)
  const maxLeads = Math.max(...sortedRows.map((row) => row.leadCount), 1)

  return (
    <div className="rounded-2xl border border-lr-border bg-lr-surface p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-lr-subtle">
            Source performance
          </p>
          <h2 className="mt-1 text-xl font-bold text-lr-strong">
            Which channels are creating value
          </h2>
        </div>
        <span className="w-fit rounded-lg bg-lr-hover px-3 py-1 text-sm font-semibold text-lr-body">
          {rows.reduce((total, row) => total + row.leadCount, 0)} leads
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {sortedRows.length === 0 ? (
          <div className="rounded-xl bg-lr-surface-muted p-4 text-sm text-lr-muted">
            Capture leads to see which sources are making money.
          </div>
        ) : (
          sortedRows.map((row) => (
            <div
              key={row.source}
              className="rounded-xl bg-lr-surface-muted p-4"
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold text-lr-strong">{row.label}</p>
                  <p className="text-sm text-lr-subtle">
                    {row.capturedCount} captured of {row.leadCount} total
                  </p>
                </div>
                <div className="text-sm font-semibold text-lr-body sm:text-right">
                  <p>{formatMoneyValue(row.revenueCents)} revenue</p>
                  <p>{row.conversionRate}% captured</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_8rem] lg:items-center">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-lr-subtle">
                    <span>Revenue</span>
                    <span>{formatMoneyValue(row.roiCents)} ROI</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-lr-surface">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{
                        width: `${clampPercent(
                          (row.revenueCents / maxRevenue) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-lr-subtle">
                    <span>Lead volume</span>
                    <span>{row.leadCount}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-lr-surface">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{
                        width: `${clampPercent(
                          (row.leadCount / maxLeads) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-lr-surface px-3 py-2 text-sm">
                  <p className="font-semibold text-lr-strong">
                    {formatMoneyValue(row.openLeadValueCents)}
                  </p>
                  <p className="text-xs font-medium text-lr-subtle">
                    open value
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function LeadStatusFunnel({
  rows,
}: {
  rows: StatusRow[]
}) {
  const total = Math.max(
    rows.reduce((sum, row) => sum + row.count, 0),
    1
  )
  const toneClassNames: Record<string, string> = {
    NEW: "bg-sky-500",
    CURRENT: "bg-amber-500",
    CONTACTED: "bg-amber-500",
    CAPTURED: "bg-emerald-500",
    CLOSED: "bg-slate-500",
  }

  return (
    <div className="rounded-2xl border border-lr-border bg-lr-surface p-5">
      <p className="text-sm font-medium text-lr-subtle">Lead status</p>
      <h2 className="mt-1 text-xl font-bold text-lr-strong">
        Current lead flow
      </h2>
      <div className="mt-5 space-y-4">
        {rows.map((row) => (
          <div key={row.status}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-lr-body">
                {row.label}
              </p>
              <p className="text-sm font-bold text-lr-strong">{row.count}</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-lr-hover">
              <div
                className={`h-full rounded-full ${
                  toneClassNames[row.status] ?? "bg-lr-surface-muted0"
                }`}
                style={{
                  width: `${clampPercent((row.count / total) * 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
