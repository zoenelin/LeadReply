# Leads Feature

Lead-specific UI and future feature components belong here when they are shared by multiple lead routes.

Keep lead business rules in `src/services/leads.ts` or the underlying `src/lib` helpers. Route components should load data, call services, and render UI.

UI components:
- `CustomersJobsWorkspace.tsx`
- `LeadDetailForm.tsx`
- `LeadFollowUpSequence.tsx`
- `LeadImportForm.tsx`
- `LeadTeamNotes.tsx`
