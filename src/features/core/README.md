# Core Module

Core covers the highest-priority LeadReply promise: capture leads, text back missed calls, guide missed-call assistant intake, and help the owner follow up.

Primary routes:
- `/leads`
- `/leads/[id]`
- `/missed-calls`
- `/settings/services`
- `/settings/calendar`

Primary service entry points:
- `src/services/core.ts`
- `src/services/leads.ts`

UI components:
- `MissedCallsInbox.tsx`
- `LeadIntakeForm.tsx`
- `ServiceCatalogForm.tsx`
- `CalendarSettingsForm.tsx`
- `AutomationSettingsForm.tsx`

AI foundation:
- Industry prompt templates live in `src/services/ai/industry-templates.ts`.
- The missed-call prompt builder lives in `src/services/ai/prompt-builder.ts`.
- The OpenAI provider call lives in `src/services/ai/openai-missed-call-assistant.ts`.
- API routes assemble business memory, service data, availability, and customer answers before calling the AI service.
