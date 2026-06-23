import {
  getHomeServiceCategoryLabel,
  isHomeServiceBusinessType,
} from "@/lib/domain/home-services"

export type IndustryAiTemplate = {
  label: string
  customerGoal: string
  intakeFocus: string[]
  likelyServices: string[]
  urgencySignals: string[]
  ownerReviewTriggers: string[]
  schedulingPolicy: string
  quotePolicy: string
  complianceFocus: string
  restrictedClaims: string[]
}

const defaultTemplate: IndustryAiTemplate = {
  label: "Local business",
  customerGoal: "understand what the customer needs and route them to the next best owner-reviewed step",
  intakeFocus: [
    "customer need",
    "urgency",
    "preferred callback or appointment time",
    "service area or location",
  ],
  likelyServices: [],
  urgencySignals: ["urgent", "today", "as soon as possible"],
  ownerReviewTriggers: [
    "unclear request",
    "custom quote",
    "customer wants a confirmed appointment",
  ],
  schedulingPolicy:
    "Collect preferred times, but do not promise availability unless a connected schedule returns a confirmed slot.",
  quotePolicy:
    "Only share configured estimate ranges. If no range is configured, collect details and tell the owner to confirm pricing.",
  complianceFocus:
    "Keep claims factual, avoid guarantees, honor consent, and route regulated questions to the business.",
  restrictedClaims: [
    "Do not guarantee appointments.",
    "Do not guarantee pricing.",
    "Do not guarantee results.",
  ],
}

const templates: Record<string, IndustryAiTemplate> = {
  AUTOMOTIVE: {
    label: "Automotive",
    customerGoal:
      "identify the vehicle, service need, urgency, and likely appointment path",
    intakeFocus: [
      "vehicle year, make, and model",
      "service or repair needed",
      "symptoms or warning lights",
      "urgency and preferred drop-off time",
    ],
    likelyServices: ["repair", "diagnostic", "maintenance", "inspection"],
    urgencySignals: ["won't start", "warning light", "unsafe", "today"],
    ownerReviewTriggers: [
      "diagnosis requested",
      "final repair price requested",
      "same-day promise requested",
    ],
    schedulingPolicy:
      "Ask for preferred drop-off or service times, but owner/shop confirmation is required unless a connected schedule confirms the slot.",
    quotePolicy:
      "Use configured service estimates only. Never diagnose or promise final repair cost from the conversation.",
    complianceFocus:
      "Avoid diagnosis, warranty promises, final repair prices, and completion-time guarantees unless approved business memory supports them.",
    restrictedClaims: [
      "Do not diagnose mechanical issues.",
      "Do not guarantee repair cost.",
      "Do not promise same-day service unless confirmed.",
    ],
  },
  HOME_SERVICES: {
    label: "Home services",
    customerGoal:
      "capture the job type, location, urgency, and owner-ready estimate details",
    intakeFocus: [
      "service needed",
      "property location or ZIP code",
      "urgency",
      "photos, access notes, or job constraints",
    ],
    likelyServices: ["repair", "estimate", "maintenance", "installation"],
    urgencySignals: [
      "emergency",
      "active leak",
      "no heat",
      "no cooling",
      "no power",
      "safety concern",
    ],
    ownerReviewTriggers: [
      "emergency arrival time requested",
      "final job price requested",
      "licensing, insurance, warranty, or permit question",
    ],
    schedulingPolicy:
      "Collect preferred visit windows and location details. Confirm that the business will verify availability.",
    quotePolicy:
      "Give only configured estimate ranges. For emergency, complex, or unseen work, require owner confirmation.",
    complianceFocus:
      "Verify licensing, insurance, warranty, emergency response, and permit claims before using them.",
    restrictedClaims: [
      "Do not promise emergency arrival times.",
      "Do not guarantee final job price.",
      "Do not claim licensing, insurance, or warranties unless provided in business data.",
    ],
  },
  BEAUTY_SERVICES: {
    label: "Beauty services",
    customerGoal:
      "understand the service, timing, preferences, and booking constraints",
    intakeFocus: [
      "service requested",
      "preferred date and time",
      "preferred stylist or technician",
      "new or returning client notes",
    ],
    likelyServices: ["appointment", "consultation", "recurring service"],
    urgencySignals: ["today", "last minute", "event", "wedding"],
    ownerReviewTriggers: [
      "specific provider requested",
      "custom service pricing",
      "result guarantee requested",
    ],
    schedulingPolicy:
      "Only book from connected availability. Otherwise collect preferences for owner confirmation.",
    quotePolicy:
      "Share menu prices or configured ranges only. Do not promise final pricing for custom services.",
    complianceFocus:
      "Avoid guaranteed beauty outcomes, medical-adjacent treatment claims, and unapproved before/after promises.",
    restrictedClaims: [
      "Do not promise a specific provider unless available.",
      "Do not guarantee results.",
      "Do not provide medical advice for skin, hair, or wellness concerns.",
    ],
  },
  FOOD_SERVICES: {
    label: "Food and restaurants",
    customerGoal:
      "classify reservation, catering, pickup, or general questions and collect the details",
    intakeFocus: [
      "reservation, catering, pickup, or event type",
      "party size or order size",
      "date and time",
      "special notes, allergies, or accommodations",
    ],
    likelyServices: ["reservation", "catering", "pickup", "event"],
    urgencySignals: ["today", "large party", "same day", "event deadline"],
    ownerReviewTriggers: [
      "allergy assurance requested",
      "reservation confirmation requested",
      "custom event pricing requested",
    ],
    schedulingPolicy:
      "Only confirm reservations from a connected booking system. Otherwise collect the requested time for staff confirmation.",
    quotePolicy:
      "Use configured menu/catering ranges only. Staff confirmation is required for custom event pricing.",
    complianceFocus:
      "Do not guarantee allergen safety, nutrition claims, availability, or custom event pricing without staff approval.",
    restrictedClaims: [
      "Do not confirm a table without connected availability.",
      "Do not guarantee allergen safety.",
      "Do not promise custom pricing.",
    ],
  },
  MEDICAL_WELLNESS: {
    label: "Medical and wellness",
    customerGoal:
      "route appointment requests while avoiding medical advice or outcome claims",
    intakeFocus: [
      "appointment type",
      "new or returning client",
      "preferred days and times",
      "non-diagnostic reason for visit",
    ],
    likelyServices: ["appointment", "consultation", "follow-up"],
    urgencySignals: ["emergency", "severe", "urgent", "today"],
    ownerReviewTriggers: [
      "medical advice requested",
      "emergency triage",
      "insurance or treatment pricing requested",
    ],
    schedulingPolicy:
      "Collect preferences only unless a connected schedule confirms an available slot.",
    quotePolicy:
      "Do not estimate insurance, treatment pricing, or medical outcomes unless the business provided exact public pricing.",
    complianceFocus:
      "Avoid medical advice, PHI in marketing, diagnosis, emergency triage, and treatment outcome claims.",
    restrictedClaims: [
      "Do not provide medical advice.",
      "Do not triage emergencies.",
      "Do not promise treatment outcomes.",
    ],
  },
  LEGAL: {
    label: "Legal",
    customerGoal:
      "capture matter type, urgency, and consultation preferences without legal advice",
    intakeFocus: [
      "matter type",
      "deadline or urgent date",
      "preferred consultation time",
      "basic contact details",
    ],
    likelyServices: ["consultation", "case review", "document review"],
    urgencySignals: ["deadline", "court", "served", "urgent"],
    ownerReviewTriggers: [
      "legal advice requested",
      "case outcome question",
      "attorney-client relationship language",
    ],
    schedulingPolicy:
      "Collect consultation preferences. Attorney or staff confirmation is required.",
    quotePolicy:
      "Do not quote legal fees unless exact consultation pricing is configured.",
    complianceFocus:
      "Avoid legal advice, outcome predictions, misleading advertising, and attorney-client relationship language.",
    restrictedClaims: [
      "Do not provide legal advice.",
      "Do not assess case outcome.",
      "Do not create attorney-client relationship language.",
    ],
  },
  FITNESS: {
    label: "Fitness",
    customerGoal:
      "capture membership, class, training, or consultation interest without health promises",
    intakeFocus: [
      "membership, class, or personal training interest",
      "customer goal",
      "preferred days and times",
      "new or returning client notes",
    ],
    likelyServices: ["membership", "class", "personal training", "trial"],
    urgencySignals: ["today", "event", "deadline"],
    ownerReviewTriggers: [
      "medical or injury advice",
      "guaranteed result requested",
      "nutrition claim requested",
    ],
    schedulingPolicy:
      "Only confirm classes or consultations from connected availability. Otherwise collect preferred times for staff confirmation.",
    quotePolicy:
      "Share configured membership or session ranges only. Do not promise health, weight-loss, or performance outcomes.",
    complianceFocus:
      "Avoid guaranteed fitness results, medical advice, injury guidance, and unapproved nutrition claims.",
    restrictedClaims: [
      "Do not guarantee weight loss or transformations.",
      "Do not provide medical or injury advice.",
      "Do not promise availability without confirmation.",
    ],
  },
  REAL_ESTATE: {
    label: "Real estate",
    customerGoal:
      "capture buying, selling, renting, or showing interest without steering or outcome promises",
    intakeFocus: [
      "buying, selling, renting, or showing request",
      "property or area of interest",
      "timeline",
      "preferred callback or showing time",
    ],
    likelyServices: ["showing", "buyer consultation", "seller consultation"],
    urgencySignals: ["offer deadline", "today", "moving soon"],
    ownerReviewTriggers: [
      "property value guarantee",
      "protected-class or neighborhood steering question",
      "legal/lending advice",
    ],
    schedulingPolicy:
      "Collect showing preferences and route them for agent or calendar confirmation.",
    quotePolicy:
      "Do not estimate legal, lending, inspection, or transaction costs unless exact approved ranges are configured.",
    complianceFocus:
      "Avoid discriminatory steering, protected-class assumptions, guaranteed sale prices, and unverified market claims.",
    restrictedClaims: [
      "Do not steer customers toward or away from neighborhoods.",
      "Do not guarantee property values or sale outcomes.",
      "Do not make protected-class assumptions.",
    ],
  },
  PROFESSIONAL_SERVICES: {
    label: "Professional services",
    customerGoal:
      "capture the scope, timeline, and consultation path for the requested service",
    intakeFocus: [
      "service requested",
      "project scope",
      "timeline",
      "preferred consultation time",
    ],
    likelyServices: ["consultation", "project", "ongoing service"],
    urgencySignals: ["deadline", "urgent", "this week"],
    ownerReviewTriggers: [
      "regulated advice requested",
      "credential claim requested",
      "guaranteed business outcome requested",
    ],
    schedulingPolicy:
      "Collect consultation preferences and confirm availability through staff or connected calendar.",
    quotePolicy:
      "Share configured consultation or service ranges only. Require owner review for custom project pricing.",
    complianceFocus:
      "Avoid credential, licensing, certification, guaranteed outcome, and professional-advice claims unless approved.",
    restrictedClaims: [
      "Do not guarantee business outcomes.",
      "Do not claim credentials unless approved.",
      "Do not provide regulated advice outside the business relationship.",
    ],
  },
  RETAIL: {
    label: "Retail",
    customerGoal:
      "capture product, inventory, pickup, order, or support interest and route the next step",
    intakeFocus: [
      "product or order question",
      "inventory, pickup, delivery, or support need",
      "deadline",
      "contact preference",
    ],
    likelyServices: ["inventory", "pickup", "order support", "delivery"],
    urgencySignals: ["today", "gift", "deadline", "pickup"],
    ownerReviewTriggers: [
      "stock guarantee requested",
      "discount promise requested",
      "delivery date promise requested",
    ],
    schedulingPolicy:
      "Collect pickup or appointment preferences, but confirm stock and timing through staff or connected systems.",
    quotePolicy:
      "Use configured product pricing or promotion details only. Do not promise stock, discounts, or delivery dates without confirmation.",
    complianceFocus:
      "Avoid inaccurate price, inventory, discount, warranty, return, and delivery promises.",
    restrictedClaims: [
      "Do not guarantee inventory.",
      "Do not promise discounts unless configured.",
      "Do not promise delivery or pickup times unless confirmed.",
    ],
  },
  OTHER: defaultTemplate,
}

type HomeServiceAiDetails = {
  intakeFocus: string[]
  likelyServices: string[]
  urgencySignals: string[]
  ownerReviewTriggers: string[]
}

const homeServiceAiDetails: Record<string, HomeServiceAiDetails> = {
  HVAC: {
    intakeFocus: [
      "system type and symptoms",
      "heating or cooling urgency",
      "property location",
      "preferred visit window",
    ],
    likelyServices: [
      "AC repair",
      "furnace repair",
      "maintenance tune-up",
      "system replacement estimate",
    ],
    urgencySignals: ["no heat", "no cooling", "burning smell", "elderly or infant in home"],
    ownerReviewTriggers: [
      "emergency arrival request",
      "refrigerant or equipment diagnosis",
      "replacement quote requested",
    ],
  },
  PLUMBING: {
    intakeFocus: [
      "fixture or pipe involved",
      "active leak or backup urgency",
      "property location",
      "photos or access notes",
    ],
    likelyServices: [
      "leak repair",
      "drain cleaning",
      "water heater service",
      "fixture installation",
    ],
    urgencySignals: ["active leak", "sewer backup", "no water", "water heater leaking"],
    ownerReviewTriggers: [
      "active water damage",
      "sewer or gas concern",
      "final repair quote requested",
    ],
  },
  ELECTRICAL: {
    intakeFocus: [
      "electrical issue and affected area",
      "safety concern or power loss",
      "property location",
      "breaker/panel/access notes",
    ],
    likelyServices: [
      "outlet or switch repair",
      "breaker panel help",
      "fixture installation",
      "diagnostic visit",
    ],
    urgencySignals: ["sparking", "burning smell", "no power", "hot panel", "safety concern"],
    ownerReviewTriggers: [
      "fire or shock risk",
      "permit or code question",
      "panel replacement quote requested",
    ],
  },
  ROOFING: {
    intakeFocus: [
      "leak, storm, or repair type",
      "active water intrusion urgency",
      "property location",
      "roof age, photos, or damage notes",
    ],
    likelyServices: [
      "roof leak repair",
      "storm damage inspection",
      "roof replacement estimate",
      "gutter repair",
    ],
    urgencySignals: ["active leak", "storm damage", "ceiling stain", "missing shingles"],
    ownerReviewTriggers: [
      "insurance claim question",
      "storm damage pricing",
      "warranty or permit claim",
    ],
  },
  LANDSCAPING: {
    intakeFocus: [
      "service or project type",
      "property size or outdoor area",
      "timeline and frequency",
      "access notes",
    ],
    likelyServices: [
      "lawn maintenance",
      "cleanup",
      "mulch or planting",
      "landscape estimate",
    ],
    urgencySignals: ["event deadline", "HOA notice", "storm cleanup", "same week"],
    ownerReviewTriggers: [
      "large design project",
      "irrigation or drainage issue",
      "recurring contract pricing",
    ],
  },
  CLEANING: {
    intakeFocus: [
      "cleaning type and property size",
      "one-time or recurring need",
      "preferred date and access notes",
      "move-in, move-out, or special conditions",
    ],
    likelyServices: [
      "standard cleaning",
      "deep cleaning",
      "move-out cleaning",
      "recurring cleaning",
    ],
    urgencySignals: ["move-out deadline", "event", "same day", "biohazard"],
    ownerReviewTriggers: [
      "hazardous cleanup",
      "large commercial request",
      "exact quote requested before walkthrough",
    ],
  },
  PEST_CONTROL: {
    intakeFocus: [
      "pest type and affected area",
      "severity and urgency",
      "property location",
      "children, pets, or access notes",
    ],
    likelyServices: [
      "general pest treatment",
      "termite inspection",
      "rodent service",
      "mosquito or outdoor treatment",
    ],
    urgencySignals: ["bed bugs", "termites", "rodents inside", "stinging insects", "infestation"],
    ownerReviewTriggers: [
      "termite or structural concern",
      "children or pets safety question",
      "guarantee requested",
    ],
  },
  HANDYMAN: {
    intakeFocus: [
      "repair or project list",
      "urgency and safety concerns",
      "property location",
      "materials, photos, or access notes",
    ],
    likelyServices: [
      "minor repair",
      "installation",
      "assembly",
      "small home project",
    ],
    urgencySignals: ["safety issue", "water damage", "door will not lock", "same day"],
    ownerReviewTriggers: [
      "licensed trade work requested",
      "structural issue",
      "large remodel scope",
    ],
  },
  APPLIANCE_REPAIR: {
    intakeFocus: [
      "appliance type and brand if known",
      "symptoms or error codes",
      "urgency",
      "property location and access notes",
    ],
    likelyServices: [
      "washer repair",
      "dryer repair",
      "refrigerator repair",
      "dishwasher repair",
    ],
    urgencySignals: ["refrigerator not cooling", "water leaking", "burning smell", "same day"],
    ownerReviewTriggers: [
      "parts availability question",
      "sealed-system refrigerator issue",
      "repair versus replace advice",
    ],
  },
  GARAGE_DOORS: {
    intakeFocus: [
      "door, spring, opener, or sensor issue",
      "stuck open/closed urgency",
      "property location",
      "door size or access notes",
    ],
    likelyServices: [
      "spring repair",
      "opener repair",
      "door off track",
      "new door estimate",
    ],
    urgencySignals: ["stuck open", "car trapped", "broken spring", "security concern"],
    ownerReviewTriggers: [
      "same-day emergency request",
      "door replacement quote",
      "commercial door request",
    ],
  },
  PAINTING: {
    intakeFocus: [
      "interior or exterior scope",
      "rooms, surfaces, or square footage",
      "timeline",
      "colors, prep, or access notes",
    ],
    likelyServices: [
      "interior painting",
      "exterior painting",
      "cabinet painting",
      "touch-up work",
    ],
    urgencySignals: ["move-in deadline", "listing deadline", "event date"],
    ownerReviewTriggers: [
      "lead paint question",
      "large exterior project",
      "exact quote without walkthrough",
    ],
  },
  FLOORING: {
    intakeFocus: [
      "flooring material and project type",
      "repair, install, or refinish scope",
      "timeline",
      "measurements, photos, or access notes",
    ],
    likelyServices: [
      "floor installation",
      "floor repair",
      "hardwood refinishing",
      "carpet replacement",
    ],
    urgencySignals: ["water damage", "trip hazard", "move-in deadline"],
    ownerReviewTriggers: [
      "subfloor damage",
      "insurance question",
      "exact material/labor quote requested",
    ],
  },
  REMODELING: {
    intakeFocus: [
      "project area and scope",
      "timeline and budget range if offered",
      "property location",
      "must-have details and owner review needs",
    ],
    likelyServices: [
      "bathroom remodel",
      "kitchen remodel",
      "basement finish",
      "room update estimate",
    ],
    urgencySignals: ["water damage", "unsafe area", "deadline before sale", "permit deadline"],
    ownerReviewTriggers: [
      "permit or structural question",
      "large budget estimate",
      "timeline guarantee requested",
    ],
  },
  JUNK_REMOVAL: {
    intakeFocus: [
      "items to remove",
      "volume or photos",
      "timeline",
      "stairs, access, or disposal notes",
    ],
    likelyServices: [
      "single-item pickup",
      "garage cleanout",
      "construction debris",
      "estate or move-out cleanout",
    ],
    urgencySignals: ["move-out deadline", "same day", "eviction", "large item blocking access"],
    ownerReviewTriggers: [
      "hazardous material",
      "very large cleanout",
      "exact quote requested without photos",
    ],
  },
  MOBILE_DETAILING: {
    intakeFocus: [
      "vehicle type and detailing package",
      "location and access",
      "preferred time",
      "stains, odors, or special notes",
    ],
    likelyServices: [
      "interior detail",
      "exterior detail",
      "full detail",
      "fleet detail",
    ],
    urgencySignals: ["same day", "event", "sale listing", "odor or spill"],
    ownerReviewTriggers: [
      "paint correction request",
      "severe stain or odor",
      "fleet pricing",
    ],
  },
}

function getHomeServiceAiTemplate(businessType: string) {
  if (!isHomeServiceBusinessType(businessType)) {
    return null
  }

  const label = getHomeServiceCategoryLabel(businessType)
  const details = homeServiceAiDetails[businessType]

  return {
    ...templates.HOME_SERVICES,
    label,
    customerGoal: `capture the ${label.toLowerCase()} service need, location, urgency, and owner-ready next step`,
    intakeFocus: details?.intakeFocus ?? templates.HOME_SERVICES.intakeFocus,
    likelyServices: details?.likelyServices ?? templates.HOME_SERVICES.likelyServices,
    urgencySignals:
      details?.urgencySignals ?? templates.HOME_SERVICES.urgencySignals,
    ownerReviewTriggers:
      details?.ownerReviewTriggers ??
      templates.HOME_SERVICES.ownerReviewTriggers,
  }
}

export function getIndustryAiTemplate(businessType: string) {
  return (
    templates[businessType] ??
    getHomeServiceAiTemplate(businessType) ??
    defaultTemplate
  )
}
