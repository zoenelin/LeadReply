export {
  buildMissedCallAssistantLeadNotes,
  buildMissedCallAssistantSummary,
  missedCallAssistantStatusClassName,
  getMissedCallAssistantCustomerConfirmation,
  getMissedCallAssistantPlan,
  getMissedCallAssistantStats,
  getMissedCallAssistantStatusLabel,
  normalizeMissedCallAssistantAnswers,
  normalizeMissedCallAssistantTranscript,
  type MissedCallAssistantAnswerMap,
  type MissedCallAssistantTranscriptEntry,
} from "@/lib/domain/missed-call-assistant"
export {
  getFollowUpSequenceMessage,
  getFollowUpSequenceStats,
} from "@/lib/domain/follow-up-sequences"
export {
  getLeadQualityScore,
} from "@/lib/domain/lead-quality"
export {
  getAverageLeadValueCents,
  getStarterLeads,
} from "@/lib/data/demo-data"
export {
  leadSourceLabels,
  leadSourceOptions,
  leadStatusLabels,
  leadStatusOptions,
  normalizeLeadStatus,
  statusClassName,
  formatMoney,
} from "@/lib/domain/lead-options"
export {
  buildAvailabilityGuidance,
  formatAvailabilityWindow,
  formatServiceEstimate,
  matchServiceFromAnswers,
} from "@/lib/domain/service-catalog"
export {
  buildMissedCallAssistantPrompt,
} from "@/services/ai/prompt-builder"
export {
  getIndustryAiTemplate,
  type IndustryAiTemplate,
} from "@/services/ai/industry-templates"
