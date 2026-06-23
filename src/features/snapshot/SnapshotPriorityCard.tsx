import Link from "next/link"
import type { PriorityAction } from "@/features/snapshot/snapshot-priority"

export function SnapshotPriorityCard({
  action,
}: {
  action: PriorityAction
}) {
  return (
    <div className="mt-8 rounded-2xl border border-lr-strong bg-lr-primary p-6 text-lr-on-primary">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
        {action.label}
      </p>
      <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-bold">{action.title}</h2>
          <p className="mt-3 max-w-2xl text-lr-on-primary/80">
            {action.description}
          </p>
        </div>
        <Link
          href={action.href}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-lr-surface px-5 py-3 text-sm font-semibold text-lr-strong hover:bg-lr-hover"
        >
          {action.buttonLabel}
        </Link>
      </div>
    </div>
  )
}
