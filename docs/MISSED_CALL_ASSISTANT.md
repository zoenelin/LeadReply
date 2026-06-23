# LeadReply missed-call assistant Design

Last updated: June 15, 2026

Launch focus: home-service businesses. The missed-call assistant should treat selected specialties such as HVAC, plumbing, electrical, roofing, cleaning, pest control, and handyman as first-class AI template inputs.

The missed-call AI flow should stay fast, guarded, and business-specific.

## Flow

1. Store business memory: business category, services, estimate rules, availability, booking settings, callback promise, location, website, and guard rails.
2. Select a home-service specialty or industry template from `src/services/ai/industry-templates.ts`.
3. Build the prompt with `src/services/ai/prompt-builder.ts`.
4. When Twilio reports a no-answer, busy, failed, or canceled call for a LeadReply phone line, LeadReply records the missed call and starts the intake automatically.
5. Starting the intake queues the first text from the business memory and industry plan.
6. As customer answers come in through Twilio, LeadReply stores the inbound `SmsMessage`, matches it to the missed-call conversation, stores transcript and answers on `MissedCallAssistantIntake`, then queues the next question.
7. When the intake is complete, LeadReply builds a rules-first summary.
8. If OpenAI is configured, `src/services/ai/openai-missed-call-assistant.ts` refines the owner-facing summary and next action.
9. The final output updates the lead, follow-up note, missed-call assistant intake, scheduling flags, quote flags, matched service, and guard-rail notes.

## Guard Rails

- AI may refine wording and summarize intent.
- AI may not invent services, prices, discounts, policies, credentials, results, or availability.
- AI may not confirm appointments unless a connected schedule confirms the slot.
- AI may not give medical/legal advice or guarantee outcomes.
- Quote estimates must come from configured service ranges or owner-approved quote rules.
- Home-service AI may not claim licensing, insurance, warranties, emergency arrival times, or final job pricing unless owner-approved business memory provides it.

## Scaling Path

Before launch:

- Keep route-level rate limits on AI-generating routes.
- Keep provider credentials optional with rules-first fallback behavior.
- Keep AI usage logs for generated growth plans and missed-call assistant summary refinement.
- Add structured app logging in the deployment host.
- Keep SMS delivery and inbound reply history visible from owner/admin screens.

After real usage:

- Add Redis-backed rate limits when the app runs on more than one instance.
- Expand queues and workers for social draft generation, review reminders, and future crawler/rank scans.
- Add monitoring and alerting for provider failures, webhook failures, AI cost spikes, SMS delivery errors, and queue depth.
- Add replayable job records for anything that affects customer communication.
