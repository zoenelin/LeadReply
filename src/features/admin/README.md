# Admin Feature

Internal LeadReply operations UI lives here. Route files stay in `src/app`, shared admin logic lives in `src/services/admin`, and this folder keeps the owner/worker-facing admin screen components together.

## Files

- `AdminOperationsDashboard.tsx`: page composition, local mutation state, and sections that are still being split.
- `AdminAiCommunicationsSection.tsx`: AI usage plus recent SMS events.
- `AdminIntegrationsSection.tsx`: provider readiness plus email/system event history.
- `AdminJobsSection.tsx`: manual job creation and queue/job controls.
- `admin-ui.tsx`: small shared admin UI primitives and formatting helpers.
