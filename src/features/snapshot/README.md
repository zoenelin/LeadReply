# Snapshot Feature

The Snapshot feature keeps the owner dashboard focused on the single most important next action plus a compact status summary.

- `snapshot-priority.ts` decides which action should be first.
- `SnapshotPriorityCard.tsx` renders that action.
- `snapshot-dashboard.ts` builds dashboard copy, module cards, loop cards, and chart-ready rows for `/dashboard`.
- Route-level data loading stays in `src/app/snapshot/page.tsx` and `src/app/dashboard/page.tsx`.

Keep heavy business calculations in `src/lib` or `src/services/modules`; this folder is for Snapshot-specific presentation and small route helpers.
