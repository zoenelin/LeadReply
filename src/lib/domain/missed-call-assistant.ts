import {
  buildAvailabilityGuidance,
  formatDuration,
  formatServiceEstimate,
  matchServiceFromAnswers,
  type AvailabilityWindowItem,
  type ServiceCatalogItem,
} from "@/lib/domain/service-catalog"
import {
  getHomeServiceCategoryLabel,
  isHomeServiceBusinessType,
} from "@/lib/domain/home-services"

import { missedCallAssistantStatuses } from "@/lib/domain/status"

export type MissedCallAssistantTranscriptEntry = {
  role: "assistant" | "customer" | "system"
  text: string
  createdAt: string
}

export type MissedCallAssistantAnswerMap = Record<string, string>

export type MissedCallAssistantQuestion = {
  key: string
  label: string
  prompt: string
  placeholder: string
  sampleAnswer: string
}

export type MissedCallAssistantPlan = {
  openingMessage: string
  questions: MissedCallAssistantQuestion[]
  ownerGuardrails: string[]
}

export type MissedCallAssistantIntakeStatsItem = {
  status: string
  schedulingRequested: boolean
  quoteRequested?: boolean
}

type MissedCallAssistantPlanInput = {
  businessName: string
  businessType: string
  callerName: string
  bookingAutomationEnabled: boolean
}

type MissedCallAssistantSummaryInput = {
  answers: MissedCallAssistantAnswerMap
  businessType: string
  bookingAutomationEnabled: boolean
  autoSchedulingEnabled: boolean
  quoteEstimateEnabled: boolean
  quoteRules: string
  quoteDisclaimer: string
  callbackTimeframe: string
  services?: ServiceCatalogItem[]
  availabilityWindows?: AvailabilityWindowItem[]
}

const genericQuestions: MissedCallAssistantQuestion[] = [
  {
    key: "request",
    label: "Request",
    prompt: "What can we help you with today?",
    placeholder: "I need help with...",
    sampleAnswer: "I need a quote and would like to talk this week.",
  },
  {
    key: "urgency",
    label: "Urgency",
    prompt: "Is this urgent today, this week, or flexible?",
    placeholder: "Today, this week, flexible...",
    sampleAnswer: "This week is fine.",
  },
]

const questionSets: Record<string, MissedCallAssistantQuestion[]> = {
  AUTOMOTIVE: [
    {
      key: "vehicle",
      label: "Vehicle",
      prompt: "What vehicle do you need help with?",
      placeholder: "2018 Toyota Camry...",
      sampleAnswer: "2018 Toyota Camry.",
    },
    {
      key: "serviceNeed",
      label: "Service needed",
      prompt: "What issue or service are you looking for?",
      placeholder: "Brake repair, inspection, oil change...",
      sampleAnswer: "Brake pads are squeaking and I need an estimate.",
    },
    {
      key: "urgency",
      label: "Urgency",
      prompt: "Is this urgent today, or are you looking to schedule this week?",
      placeholder: "Today, tomorrow, this week...",
      sampleAnswer: "This week works.",
    },
  ],
  HOME_SERVICES: [
    {
      key: "projectType",
      label: "Project",
      prompt: "What service or project do you need help with?",
      placeholder: "Repair, estimate, emergency service...",
      sampleAnswer: "I need an estimate for a leaking sink.",
    },
    {
      key: "location",
      label: "Location",
      prompt: "What city or ZIP code is the job in?",
      placeholder: "City or ZIP...",
      sampleAnswer: "Austin, 78702.",
    },
    {
      key: "urgency",
      label: "Urgency",
      prompt: "Is this urgent today, this week, or flexible?",
      placeholder: "Today, this week, flexible...",
      sampleAnswer: "Tomorrow would be best.",
    },
  ],
  BEAUTY_SERVICES: [
    {
      key: "serviceNeed",
      label: "Service",
      prompt: "What service are you looking to book?",
      placeholder: "Haircut, nails, color, full set...",
      sampleAnswer: "A haircut and color.",
    },
    {
      key: "timing",
      label: "Timing",
      prompt: "What day or time works best for you?",
      placeholder: "Friday afternoon, Saturday morning...",
      sampleAnswer: "Friday afternoon if possible.",
    },
    {
      key: "preference",
      label: "Preference",
      prompt: "Do you have a preferred stylist, tech, or service provider?",
      placeholder: "No preference, specific person...",
      sampleAnswer: "No preference.",
    },
  ],
  FOOD_SERVICES: [
    {
      key: "requestType",
      label: "Request type",
      prompt: "Are you asking about a reservation, catering, pickup, or something else?",
      placeholder: "Reservation, catering, pickup...",
      sampleAnswer: "Reservation.",
    },
    {
      key: "partyDetails",
      label: "Party details",
      prompt: "How many people and what date or time are you hoping for?",
      placeholder: "4 people Friday at 7...",
      sampleAnswer: "4 people this Friday around 7 PM.",
    },
    {
      key: "specialNotes",
      label: "Special notes",
      prompt: "Any special requests we should know about?",
      placeholder: "Birthday, patio, allergies...",
      sampleAnswer: "A booth would be nice.",
    },
  ],
  MEDICAL_WELLNESS: [
    {
      key: "appointmentType",
      label: "Appointment type",
      prompt: "What type of appointment are you looking for?",
      placeholder: "Consultation, follow-up, service...",
      sampleAnswer: "A new client consultation.",
    },
    {
      key: "timing",
      label: "Timing",
      prompt: "What days or times usually work best for you?",
      placeholder: "Mornings, afternoons, specific day...",
      sampleAnswer: "Mornings work best.",
    },
    {
      key: "newOrReturning",
      label: "Client type",
      prompt: "Are you a new or returning client?",
      placeholder: "New client, returning client...",
      sampleAnswer: "New client.",
    },
  ],
  LEGAL: [
    {
      key: "matterType",
      label: "Matter type",
      prompt: "What type of legal help are you looking for?",
      placeholder: "Family, business, estate, injury...",
      sampleAnswer: "Business contract review.",
    },
    {
      key: "urgency",
      label: "Urgency",
      prompt: "Is there a deadline or urgent date involved?",
      placeholder: "Court date, deadline, no rush...",
      sampleAnswer: "No hard deadline, but this week would help.",
    },
    {
      key: "consultationTime",
      label: "Consultation time",
      prompt: "What is the best time to reach you for a consultation?",
      placeholder: "Tomorrow morning, weekday afternoons...",
      sampleAnswer: "Tomorrow afternoon.",
    },
  ],
  FITNESS: [
    {
      key: "interest",
      label: "Interest",
      prompt: "Are you interested in classes, personal training, or membership options?",
      placeholder: "Classes, training, membership...",
      sampleAnswer: "Personal training.",
    },
    {
      key: "goal",
      label: "Goal",
      prompt: "What goal are you working toward?",
      placeholder: "Strength, weight loss, flexibility...",
      sampleAnswer: "Strength and accountability.",
    },
    {
      key: "timing",
      label: "Timing",
      prompt: "What days or times usually work best?",
      placeholder: "Weekday mornings, evenings...",
      sampleAnswer: "Weekday evenings.",
    },
  ],
  REAL_ESTATE: [
    {
      key: "requestType",
      label: "Request type",
      prompt: "Are you looking to buy, sell, rent, or schedule a showing?",
      placeholder: "Buy, sell, rent, showing...",
      sampleAnswer: "Schedule a showing.",
    },
    {
      key: "propertyDetails",
      label: "Property details",
      prompt: "What property or area are you interested in?",
      placeholder: "Address, neighborhood, price range...",
      sampleAnswer: "Homes near downtown under $450k.",
    },
    {
      key: "timing",
      label: "Timing",
      prompt: "When would you like to talk or meet?",
      placeholder: "Today, weekend, next week...",
      sampleAnswer: "Saturday morning.",
    },
  ],
  PROFESSIONAL_SERVICES: [
    {
      key: "serviceNeed",
      label: "Service needed",
      prompt: "What service are you looking for?",
      placeholder: "Consulting, project help, estimate...",
      sampleAnswer: "I need help scoping a project.",
    },
    {
      key: "timeline",
      label: "Timeline",
      prompt: "What timeline are you hoping for?",
      placeholder: "This week, this month...",
      sampleAnswer: "I want to start this month.",
    },
    {
      key: "budgetOrScope",
      label: "Scope",
      prompt: "Do you have a rough scope or budget in mind?",
      placeholder: "Small project, ongoing work...",
      sampleAnswer: "Small project first, maybe ongoing after.",
    },
  ],
  RETAIL: [
    {
      key: "requestType",
      label: "Request type",
      prompt: "Are you asking about inventory, pickup, an order, or something else?",
      placeholder: "Inventory, pickup, order status...",
      sampleAnswer: "Inventory.",
    },
    {
      key: "productDetails",
      label: "Product details",
      prompt: "What product or order are you asking about?",
      placeholder: "Product name, size, order number...",
      sampleAnswer: "A blue medium jacket.",
    },
    {
      key: "timing",
      label: "Timing",
      prompt: "When do you need it by?",
      placeholder: "Today, this weekend, no rush...",
      sampleAnswer: "This weekend.",
    },
  ],
}

const schedulingQuestion = {
  key: "preferredTime",
  label: "Preferred time",
  placeholder: "Today after 3, Friday morning, any weekday...",
  sampleAnswer: "Tomorrow after 2 PM.",
}

const homeServiceQuestionSets: Record<string, MissedCallAssistantQuestion[]> = {
  HVAC: [
    {
      key: "serviceNeed",
      label: "Service needed",
      prompt: "What HVAC issue do you need help with?",
      placeholder: "AC not cooling, furnace issue, tune-up...",
      sampleAnswer: "My AC is running but not cooling.",
    },
    {
      key: "systemDetails",
      label: "System details",
      prompt: "What type of system is it, and do you know the brand or age?",
      placeholder: "Central air, heat pump, furnace, brand...",
      sampleAnswer: "Central AC, about 8 years old.",
    },
    {
      key: "urgency",
      label: "Urgency",
      prompt: "Is there no heat/cooling, a safety concern, or is this routine?",
      placeholder: "No cooling, no heat, tune-up, burning smell...",
      sampleAnswer: "No cooling and I would like help today.",
    },
    {
      key: "location",
      label: "Location",
      prompt: "What city or ZIP code is the job in?",
      placeholder: "City or ZIP...",
      sampleAnswer: "Austin, 78702.",
    },
  ],
  PLUMBING: [
    {
      key: "serviceNeed",
      label: "Service needed",
      prompt: "What plumbing issue do you need help with?",
      placeholder: "Leak, clog, water heater, fixture...",
      sampleAnswer: "The kitchen sink is leaking underneath.",
    },
    {
      key: "urgency",
      label: "Urgency",
      prompt: "Is water actively leaking, backing up, or shut off right now?",
      placeholder: "Active leak, sewer backup, no water, not urgent...",
      sampleAnswer: "It is actively leaking when we use the sink.",
    },
    {
      key: "location",
      label: "Location",
      prompt: "What city or ZIP code is the job in?",
      placeholder: "City or ZIP...",
      sampleAnswer: "Austin, 78702.",
    },
    {
      key: "jobDetails",
      label: "Job details",
      prompt: "Any photos, access notes, or fixture details the plumber should know?",
      placeholder: "Under sink, upstairs bathroom, photos available...",
      sampleAnswer: "It is under the kitchen sink and I can send a photo.",
    },
  ],
  ELECTRICAL: [
    {
      key: "serviceNeed",
      label: "Service needed",
      prompt: "What electrical issue or project do you need help with?",
      placeholder: "Outlet, breaker, lights, panel, install...",
      sampleAnswer: "Several outlets stopped working.",
    },
    {
      key: "urgency",
      label: "Safety/urgency",
      prompt: "Any sparking, burning smell, hot panel, or loss of power?",
      placeholder: "Sparking, burning smell, no power, routine...",
      sampleAnswer: "No burning smell, but the outlets do not work.",
    },
    {
      key: "location",
      label: "Location",
      prompt: "What city or ZIP code is the job in?",
      placeholder: "City or ZIP...",
      sampleAnswer: "Austin, 78702.",
    },
    {
      key: "jobDetails",
      label: "Job details",
      prompt: "Where is the affected area, and is the breaker panel accessible?",
      placeholder: "Kitchen outlets, garage panel, upstairs lights...",
      sampleAnswer: "Kitchen outlets. The garage panel is accessible.",
    },
  ],
  ROOFING: [
    {
      key: "serviceNeed",
      label: "Service needed",
      prompt: "What roofing issue do you need help with?",
      placeholder: "Leak, storm damage, missing shingles, estimate...",
      sampleAnswer: "I have a leak after the storm.",
    },
    {
      key: "urgency",
      label: "Urgency",
      prompt: "Is water actively coming in, or is this an inspection/estimate?",
      placeholder: "Active leak, ceiling stain, inspection, estimate...",
      sampleAnswer: "There is a ceiling stain but no dripping right now.",
    },
    {
      key: "location",
      label: "Location",
      prompt: "What city or ZIP code is the property in?",
      placeholder: "City or ZIP...",
      sampleAnswer: "Austin, 78702.",
    },
    {
      key: "jobDetails",
      label: "Job details",
      prompt: "Do you know the roof age, and can you share photos or damage notes?",
      placeholder: "Roof age, photos, shingles, access...",
      sampleAnswer: "Roof is about 12 years old and I can send photos.",
    },
  ],
  LANDSCAPING: [
    {
      key: "serviceNeed",
      label: "Service needed",
      prompt: "What landscaping or lawn service do you need?",
      placeholder: "Mowing, cleanup, mulch, design, estimate...",
      sampleAnswer: "I need a cleanup and mulch estimate.",
    },
    {
      key: "propertyDetails",
      label: "Property details",
      prompt: "How large is the area, and is this one-time or recurring?",
      placeholder: "Small yard, half acre, one-time, weekly...",
      sampleAnswer: "Small front and back yard, one-time for now.",
    },
    {
      key: "timeline",
      label: "Timeline",
      prompt: "When would you like this done?",
      placeholder: "This week, before an event, flexible...",
      sampleAnswer: "This week if possible.",
    },
    {
      key: "location",
      label: "Location",
      prompt: "What city or ZIP code is the property in?",
      placeholder: "City or ZIP...",
      sampleAnswer: "Austin, 78702.",
    },
  ],
  CLEANING: [
    {
      key: "serviceNeed",
      label: "Service needed",
      prompt: "What type of cleaning do you need?",
      placeholder: "Standard, deep clean, move-out, recurring...",
      sampleAnswer: "A move-out deep clean.",
    },
    {
      key: "propertyDetails",
      label: "Property details",
      prompt: "How many bedrooms/bathrooms or what size is the space?",
      placeholder: "3 bed, 2 bath, apartment, office size...",
      sampleAnswer: "Two bedroom, two bathroom apartment.",
    },
    {
      key: "timeline",
      label: "Timeline",
      prompt: "When do you need the cleaning completed?",
      placeholder: "Today, this weekend, before move-out...",
      sampleAnswer: "Before Saturday afternoon.",
    },
    {
      key: "jobDetails",
      label: "Access/details",
      prompt: "Any access notes, pets, or special conditions?",
      placeholder: "Key code, pets, appliances, stains...",
      sampleAnswer: "No pets. I can provide a door code.",
    },
  ],
  PEST_CONTROL: [
    {
      key: "serviceNeed",
      label: "Pest issue",
      prompt: "What pest or problem are you seeing?",
      placeholder: "Ants, roaches, rodents, termites, wasps...",
      sampleAnswer: "We are seeing ants in the kitchen.",
    },
    {
      key: "affectedArea",
      label: "Affected area",
      prompt: "Where are you seeing the issue, and how severe is it?",
      placeholder: "Kitchen, attic, outside, many/few...",
      sampleAnswer: "Mostly in the kitchen, a small trail daily.",
    },
    {
      key: "safetyNotes",
      label: "Safety notes",
      prompt: "Any children, pets, allergies, or access notes the technician should know?",
      placeholder: "Pets, children, gate, tenant access...",
      sampleAnswer: "We have one dog.",
    },
    {
      key: "location",
      label: "Location",
      prompt: "What city or ZIP code is the property in?",
      placeholder: "City or ZIP...",
      sampleAnswer: "Austin, 78702.",
    },
  ],
  HANDYMAN: [
    {
      key: "serviceNeed",
      label: "Project",
      prompt: "What repair or project do you need help with?",
      placeholder: "Door repair, drywall, install, list of small jobs...",
      sampleAnswer: "I need drywall patched and a door adjusted.",
    },
    {
      key: "urgency",
      label: "Urgency",
      prompt: "Is anything unsafe, leaking, or time-sensitive?",
      placeholder: "Unsafe, leaking, before move-out, flexible...",
      sampleAnswer: "Not urgent, just this week if possible.",
    },
    {
      key: "jobDetails",
      label: "Details",
      prompt: "Do you have materials already, photos, or measurements?",
      placeholder: "Materials, photos, measurements, access...",
      sampleAnswer: "I can send photos and do not have materials.",
    },
    {
      key: "location",
      label: "Location",
      prompt: "What city or ZIP code is the job in?",
      placeholder: "City or ZIP...",
      sampleAnswer: "Austin, 78702.",
    },
  ],
  APPLIANCE_REPAIR: [
    {
      key: "serviceNeed",
      label: "Appliance",
      prompt: "What appliance needs repair?",
      placeholder: "Washer, dryer, refrigerator, dishwasher...",
      sampleAnswer: "My refrigerator is not cooling.",
    },
    {
      key: "systemDetails",
      label: "Brand/symptoms",
      prompt: "Do you know the brand, model, symptoms, or any error code?",
      placeholder: "Brand, model, error code, symptoms...",
      sampleAnswer: "Samsung fridge, no error code.",
    },
    {
      key: "urgency",
      label: "Urgency",
      prompt: "Is it leaking, not cooling, or otherwise urgent today?",
      placeholder: "Leaking, not cooling, burning smell, flexible...",
      sampleAnswer: "Not cooling, so today would be ideal.",
    },
    {
      key: "location",
      label: "Location",
      prompt: "What city or ZIP code is the appliance in?",
      placeholder: "City or ZIP...",
      sampleAnswer: "Austin, 78702.",
    },
  ],
  GARAGE_DOORS: [
    {
      key: "serviceNeed",
      label: "Service needed",
      prompt: "What garage door issue do you need help with?",
      placeholder: "Broken spring, opener, off track, new door...",
      sampleAnswer: "The spring broke and the door will not open.",
    },
    {
      key: "urgency",
      label: "Urgency",
      prompt: "Is the door stuck open/closed, or is a car trapped?",
      placeholder: "Stuck open, stuck closed, car trapped, routine...",
      sampleAnswer: "It is stuck closed with a car inside.",
    },
    {
      key: "jobDetails",
      label: "Door details",
      prompt: "Do you know the door size, opener brand, or have access notes?",
      placeholder: "Single/double door, opener brand, access...",
      sampleAnswer: "Double door, opener brand unknown.",
    },
    {
      key: "location",
      label: "Location",
      prompt: "What city or ZIP code is the property in?",
      placeholder: "City or ZIP...",
      sampleAnswer: "Austin, 78702.",
    },
  ],
  PAINTING: [
    {
      key: "serviceNeed",
      label: "Service needed",
      prompt: "What painting project do you need help with?",
      placeholder: "Interior, exterior, cabinets, touch-up...",
      sampleAnswer: "Interior painting for two bedrooms.",
    },
    {
      key: "propertyDetails",
      label: "Scope",
      prompt: "What rooms, surfaces, or rough square footage are involved?",
      placeholder: "Rooms, trim, cabinets, square footage...",
      sampleAnswer: "Two bedrooms and trim.",
    },
    {
      key: "timeline",
      label: "Timeline",
      prompt: "When would you like the project completed?",
      placeholder: "This month, before move-in, flexible...",
      sampleAnswer: "Before we move in next month.",
    },
    {
      key: "jobDetails",
      label: "Details",
      prompt: "Any colors, prep work, repairs, or access notes?",
      placeholder: "Color, drywall repair, furniture, access...",
      sampleAnswer: "Walls need small nail holes patched.",
    },
  ],
  FLOORING: [
    {
      key: "serviceNeed",
      label: "Service needed",
      prompt: "What flooring project do you need help with?",
      placeholder: "Install, repair, refinish, carpet, tile...",
      sampleAnswer: "I need vinyl plank installed.",
    },
    {
      key: "propertyDetails",
      label: "Scope",
      prompt: "What rooms or approximate square footage are involved?",
      placeholder: "Rooms, square footage, stairs, material...",
      sampleAnswer: "About 600 square feet downstairs.",
    },
    {
      key: "urgency",
      label: "Urgency",
      prompt: "Is there water damage, a trip hazard, or a move-in deadline?",
      placeholder: "Water damage, trip hazard, move-in deadline...",
      sampleAnswer: "No damage, but we move in next month.",
    },
    {
      key: "location",
      label: "Location",
      prompt: "What city or ZIP code is the property in?",
      placeholder: "City or ZIP...",
      sampleAnswer: "Austin, 78702.",
    },
  ],
  REMODELING: [
    {
      key: "serviceNeed",
      label: "Project",
      prompt: "What remodeling project are you considering?",
      placeholder: "Kitchen, bathroom, basement, room update...",
      sampleAnswer: "A bathroom remodel.",
    },
    {
      key: "projectScope",
      label: "Scope",
      prompt: "What are the must-have changes or main goals for the project?",
      placeholder: "Shower, vanity, layout, fixtures, tile...",
      sampleAnswer: "Replace the shower, vanity, and tile.",
    },
    {
      key: "timeline",
      label: "Timeline",
      prompt: "When are you hoping to start or finish?",
      placeholder: "As soon as possible, this summer, flexible...",
      sampleAnswer: "Start within the next two months.",
    },
    {
      key: "location",
      label: "Location",
      prompt: "What city or ZIP code is the property in?",
      placeholder: "City or ZIP...",
      sampleAnswer: "Austin, 78702.",
    },
  ],
  JUNK_REMOVAL: [
    {
      key: "serviceNeed",
      label: "Items",
      prompt: "What items do you need removed?",
      placeholder: "Furniture, appliances, yard waste, debris...",
      sampleAnswer: "Old furniture and boxes from the garage.",
    },
    {
      key: "volume",
      label: "Volume",
      prompt: "About how much is there, or can you send photos?",
      placeholder: "Pickup truck load, room full, photos available...",
      sampleAnswer: "About a pickup truck load and I can send photos.",
    },
    {
      key: "jobDetails",
      label: "Access",
      prompt: "Any stairs, heavy items, parking, or access notes?",
      placeholder: "Stairs, elevator, driveway, heavy items...",
      sampleAnswer: "Everything is in the garage with driveway access.",
    },
    {
      key: "timeline",
      label: "Timeline",
      prompt: "When do you need it removed?",
      placeholder: "Today, this week, before move-out...",
      sampleAnswer: "This week.",
    },
  ],
  MOBILE_DETAILING: [
    {
      key: "serviceNeed",
      label: "Service needed",
      prompt: "What vehicle detailing service are you looking for?",
      placeholder: "Interior, exterior, full detail, fleet...",
      sampleAnswer: "A full detail for my SUV.",
    },
    {
      key: "vehicle",
      label: "Vehicle",
      prompt: "What vehicle type and condition should the detailer know about?",
      placeholder: "Sedan, SUV, truck, stains, odor...",
      sampleAnswer: "SUV with pet hair in the back.",
    },
    {
      key: "location",
      label: "Location",
      prompt: "Where would the vehicle be detailed, and is water/power available?",
      placeholder: "Home, work, driveway, water/power...",
      sampleAnswer: "At home in the driveway with water and power.",
    },
    {
      key: "timeline",
      label: "Timeline",
      prompt: "What day or time works best?",
      placeholder: "Today, weekend, weekday morning...",
      sampleAnswer: "Saturday morning.",
    },
  ],
}

function getHomeServiceQuestions(businessType: string) {
  if (!isHomeServiceBusinessType(businessType)) {
    return null
  }

  const homeServiceQuestions = homeServiceQuestionSets[businessType]

  if (homeServiceQuestions) {
    return homeServiceQuestions
  }

  const serviceLabel = getHomeServiceCategoryLabel(businessType).toLowerCase()

  return [
    {
      key: "serviceNeed",
      label: "Service needed",
      prompt: `What ${serviceLabel} service do you need help with?`,
      placeholder: "Repair, estimate, maintenance, urgent help...",
      sampleAnswer: "I need an estimate for a repair.",
    },
    {
      key: "location",
      label: "Location",
      prompt: "What city or ZIP code is the job in?",
      placeholder: "City or ZIP...",
      sampleAnswer: "Austin, 78702.",
    },
    {
      key: "urgency",
      label: "Urgency",
      prompt: "Is this urgent today, this week, or flexible?",
      placeholder: "Today, this week, flexible...",
      sampleAnswer: "Tomorrow would be best.",
    },
    {
      key: "jobDetails",
      label: "Job details",
      prompt:
        "Any details, photos, access notes, or constraints the team should know?",
      placeholder: "Photos, access, property details, special notes...",
      sampleAnswer: "Side gate is unlocked and I can send photos.",
    },
  ]
}

function getQuestions(businessType: string, bookingAutomationEnabled: boolean) {
  const baseQuestions =
    questionSets[businessType] ??
    getHomeServiceQuestions(businessType) ??
    genericQuestions

  return [
    ...baseQuestions,
    {
      ...schedulingQuestion,
      prompt: bookingAutomationEnabled
        ? "If we have an opening, what day or time should I check first?"
        : "What day or time would you prefer so the business can confirm?",
    },
  ]
}

function makeEntry(
  role: MissedCallAssistantTranscriptEntry["role"],
  text: string
): MissedCallAssistantTranscriptEntry {
  return {
    role,
    text,
    createdAt: new Date().toISOString(),
  }
}

function readRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function pickFirstAnswer(answers: MissedCallAssistantAnswerMap, keys: string[]) {
  for (const key of keys) {
    const value = answers[key]?.trim()
    if (value) {
      return value
    }
  }

  return ""
}

function detectUrgency(answers: MissedCallAssistantAnswerMap) {
  const answerText = Object.values(answers).join(" ").toLowerCase()

  if (/(emergency|urgent|asap|right now|today|tonight)/.test(answerText)) {
    return "Urgent"
  }

  if (/(tomorrow|this week|weekend|soon)/.test(answerText)) {
    return "Soon"
  }

  return "Flexible"
}

function detectQuoteRequest(answers: MissedCallAssistantAnswerMap) {
  const answerText = Object.values(answers).join(" ").toLowerCase()

  return /(quote|estimate|price|pricing|cost|how much|\$)/.test(answerText)
}

function cleanSummaryPhrase(value: string) {
  return value.trim().replace(/[.!?]+$/, "")
}

function getSchedulingMode({
  bookingAutomationEnabled,
  autoSchedulingEnabled,
  matchedService,
}: {
  bookingAutomationEnabled: boolean
  autoSchedulingEnabled: boolean
  matchedService: ServiceCatalogItem | null
}) {
  if (
    bookingAutomationEnabled &&
    matchedService &&
    (!matchedService.bookableOnline || matchedService.ownerConfirmRequired)
  ) {
    return "SERVICE_OWNER_CONFIRM"
  }

  if (bookingAutomationEnabled && autoSchedulingEnabled) {
    return "CONFIRMED_SLOT_ONLY"
  }

  if (bookingAutomationEnabled) {
    return "CHECK_AVAILABILITY_OWNER_CONFIRM"
  }

  return "OWNER_CONFIRM"
}

function getIndustryContext(businessType: string) {
  if (isHomeServiceBusinessType(businessType)) {
    return "home service job"
  }

  if (businessType === "FOOD_SERVICES") {
    return "reservation/order"
  }

  if (businessType === "BEAUTY_SERVICES") {
    return "appointment"
  }

  if (businessType === "AUTOMOTIVE") {
    return "service appointment"
  }

  if (businessType === "LEGAL") {
    return "consultation"
  }

  return "customer request"
}

function getSchedulingAction({
  preferredTime,
  industryContext,
  bookingAutomationEnabled,
  autoSchedulingEnabled,
  callbackTimeframe,
  matchedService,
  availabilityGuidance,
}: {
  preferredTime: string
  industryContext: string
  bookingAutomationEnabled: boolean
  autoSchedulingEnabled: boolean
  callbackTimeframe: string
  matchedService: ServiceCatalogItem | null
  availabilityGuidance: string
}) {
  const serviceContext = matchedService
    ? `${matchedService.name} (${formatDuration(
        matchedService.durationMinutes
      )})`
    : industryContext

  if (
    bookingAutomationEnabled &&
    matchedService &&
    (!matchedService.bookableOnline || matchedService.ownerConfirmRequired)
  ) {
    return `Collect preferred times for ${serviceContext}, but owner confirmation is required before promising a slot. ${availabilityGuidance}`
  }

  if (bookingAutomationEnabled && autoSchedulingEnabled) {
    return `Offer only confirmed open slots from the connected schedule for this ${serviceContext}. Do not invent availability. If no slot matches ${preferredTime}, collect alternate times. ${availabilityGuidance}`
  }

  if (bookingAutomationEnabled) {
    return `Check connected availability for this ${serviceContext}, but owner confirmation is required before promising a slot. Preferred time: ${preferredTime}. ${availabilityGuidance}`
  }

  return `Scheduling is not connected yet. Text or call the customer ${callbackTimeframe} to confirm ${preferredTime}.`
}

function getQuoteGuidance({
  quoteRequested,
  quoteEstimateEnabled,
  quoteRules,
  quoteDisclaimer,
  matchedService,
}: {
  quoteRequested: boolean
  quoteEstimateEnabled: boolean
  quoteRules: string
  quoteDisclaimer: string
  matchedService: ServiceCatalogItem | null
}) {
  if (!quoteRequested) {
    return ""
  }

  if (
    quoteEstimateEnabled &&
    matchedService &&
    (matchedService.estimateLowCents > 0 || matchedService.estimateHighCents > 0)
  ) {
    return `Quote request detected. Matched service: ${
      matchedService.name
    }. Share only this configured range: ${formatServiceEstimate(
      matchedService
    )}. Disclaimer: ${quoteDisclaimer.trim()}`
  }

  if (quoteEstimateEnabled && quoteRules.trim()) {
    return `Quote request detected. Share estimated ranges only from these configured rules: ${quoteRules.trim()} Disclaimer: ${quoteDisclaimer.trim()}`
  }

  return "Quote request detected. Do not give a price yet; the owner should confirm the estimate before replying."
}

export function getMissedCallAssistantPlan({
  businessName,
  businessType,
  callerName,
  bookingAutomationEnabled,
}: MissedCallAssistantPlanInput): MissedCallAssistantPlan {
  const questions = getQuestions(businessType, bookingAutomationEnabled)

  return {
    openingMessage: `Hi ${callerName}, this is LeadReply for ${businessName}. Sorry we missed your call. I can ask a few quick questions so the team knows how to help.`,
    questions,
    ownerGuardrails: [
      "Ask only enough to understand the customer need, timing, and next step.",
      "Do not promise a booked time unless a connected schedule confirms it.",
      "Do not give a quote unless the business has configured approved quote rules or service ranges.",
    ],
  }
}

export function getMissedCallAssistantCustomerConfirmation({
  callbackTimeframe,
  quoteRequested,
  schedulingRequested,
}: {
  callbackTimeframe: string
  quoteRequested: boolean
  schedulingRequested: boolean
}) {
  const scheduleLine = schedulingRequested
    ? "The team will confirm the best available time before anything is booked."
    : "The team will follow up with the right next step."
  const quoteLine = quoteRequested
    ? "If pricing is needed, they will confirm the estimate before sending a final quote."
    : ""

  return [
    `Thanks. I sent this to the team so they can follow up ${callbackTimeframe}.`,
    scheduleLine,
    quoteLine,
  ]
    .filter(Boolean)
    .join(" ")
}

export function createAssistantEntry(text: string) {
  return makeEntry("assistant", text)
}

export function createCustomerEntry(text: string) {
  return makeEntry("customer", text)
}

export function normalizeMissedCallAssistantTranscript(
  value: unknown
): MissedCallAssistantTranscriptEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((entry) => {
    const record = readRecord(entry)
    const role = record.role
    const text = record.text
    const createdAt = record.createdAt

    if (
      (role !== "assistant" && role !== "customer" && role !== "system") ||
      typeof text !== "string"
    ) {
      return []
    }

    const normalizedRole: MissedCallAssistantTranscriptEntry["role"] = role

    return [
      {
        role: normalizedRole,
        text,
        createdAt:
          typeof createdAt === "string" ? createdAt : new Date().toISOString(),
      },
    ]
  })
}

export function normalizeMissedCallAssistantAnswers(value: unknown): MissedCallAssistantAnswerMap {
  const record = readRecord(value)

  return Object.fromEntries(
    Object.entries(record).flatMap(([key, answer]) =>
      typeof answer === "string" ? [[key, answer]] : []
    )
  )
}

export function getMissedCallAssistantStatusLabel(status: string) {
  if (status === missedCallAssistantStatuses.readyForOwner) {
    return "Ready for owner"
  }

  if (status === missedCallAssistantStatuses.completed) {
    return "Completed"
  }

  return "In progress"
}

export function missedCallAssistantStatusClassName(status: string) {
  if (status === missedCallAssistantStatuses.readyForOwner) {
    return "bg-emerald-50 text-emerald-700"
  }

  if (status === missedCallAssistantStatuses.completed) {
    return "bg-lr-hover text-lr-muted"
  }

  return "bg-sky-50 text-sky-700"
}

export function buildMissedCallAssistantSummary({
  answers,
  businessType,
  bookingAutomationEnabled,
  autoSchedulingEnabled,
  quoteEstimateEnabled,
  quoteRules,
  quoteDisclaimer,
  callbackTimeframe,
  services = [],
  availabilityWindows = [],
}: MissedCallAssistantSummaryInput) {
  const intent = cleanSummaryPhrase(
    pickFirstAnswer(answers, [
      "serviceNeed",
      "systemDetails",
      "affectedArea",
      "projectScope",
      "propertyDetails",
      "volume",
      "vehicle",
      "requestType",
      "projectType",
      "appointmentType",
      "matterType",
      "interest",
      "request",
    ]) || "Needs follow-up"
  )
  const rawPreferredTime = pickFirstAnswer(answers, [
    "preferredTime",
    "timing",
    "consultationTime",
    "timeline",
    "urgency",
  ])
  const preferredTime = cleanSummaryPhrase(
    rawPreferredTime || "No preferred time collected"
  )
  const urgency = detectUrgency(answers)
  const quoteRequested = detectQuoteRequest(answers)
  const schedulingRequested = Boolean(rawPreferredTime.trim())
  const matchedService = matchServiceFromAnswers({
    answers,
    services,
  })
  const availabilityGuidance = buildAvailabilityGuidance(availabilityWindows)
  const industryContext = getIndustryContext(businessType)
  const schedulingMode = getSchedulingMode({
    bookingAutomationEnabled,
    autoSchedulingEnabled,
    matchedService,
  })
  const quoteGuidance = getQuoteGuidance({
    quoteRequested,
    quoteEstimateEnabled,
    quoteRules,
    quoteDisclaimer,
    matchedService,
  })
  const serviceSummary = matchedService
    ? ` Matched service: ${matchedService.name}.`
    : ""
  const summary = `${intent}. Timing: ${preferredTime}. Urgency: ${urgency}.${serviceSummary}${
    quoteRequested ? " Quote requested." : ""
  }`
  const schedulingAction = schedulingRequested
    ? getSchedulingAction({
        preferredTime,
        industryContext,
        bookingAutomationEnabled,
        autoSchedulingEnabled,
        callbackTimeframe,
        matchedService,
        availabilityGuidance,
      })
    : `No preferred time was collected. Reply ${callbackTimeframe} to confirm the next step.`
  const nextAction = quoteGuidance
    ? `${schedulingAction} ${quoteGuidance}`
    : schedulingAction

  return {
    intent,
    urgency,
    preferredTime,
    schedulingRequested,
    schedulingMode,
    quoteRequested,
    quoteGuidance,
    matchedServiceId: matchedService?.id ?? null,
    matchedServiceName: matchedService?.name ?? "",
    matchedQuoteLowCents: matchedService?.estimateLowCents ?? 0,
    matchedQuoteHighCents: matchedService?.estimateHighCents ?? 0,
    matchedDurationMinutes: matchedService?.durationMinutes ?? 0,
    matchedServiceEstimate: matchedService
      ? formatServiceEstimate(matchedService)
      : "",
    matchedServiceDuration: matchedService
      ? formatDuration(matchedService.durationMinutes)
      : "",
    serviceBookableOnline: matchedService?.bookableOnline ?? false,
    availabilityGuidance,
    summary,
    nextAction,
  }
}

export function buildMissedCallAssistantLeadNotes({
  summary,
  nextAction,
  schedulingMode,
  quoteGuidance,
  matchedServiceName,
  serviceEstimate,
  serviceDuration,
  availabilityGuidance,
  answers,
}: {
  summary: string
  nextAction: string
  schedulingMode?: string
  quoteGuidance?: string
  matchedServiceName?: string
  serviceEstimate?: string
  serviceDuration?: string
  availabilityGuidance?: string
  answers: MissedCallAssistantAnswerMap
}) {
  const answerLines = Object.entries(answers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n")

  return `LeadReply missed-call assistant summary:\n${summary}\n\nRecommended next action:\n${nextAction}\n\nScheduling rule:\n${
    schedulingMode || "OWNER_CONFIRM"
  }\n\nQuote guidance:\n${
    quoteGuidance || "No quote requested or owner confirmation required."
  }\n\nMatched service:\n${
    matchedServiceName || "No configured service matched."
  }\n\nService estimate:\n${
    serviceEstimate || "No configured service estimate."
  }\n\nService duration:\n${
    serviceDuration || "No configured duration."
  }\n\nAvailability:\n${
    availabilityGuidance || "No configured availability."
  }\n\nAnswers:\n${answerLines}`
}

export function getMissedCallAssistantStats(intakes: MissedCallAssistantIntakeStatsItem[]) {
  const inProgressCount = intakes.filter(
    (intake) => intake.status === missedCallAssistantStatuses.inProgress
  ).length
  const readyCount = intakes.filter(
    (intake) => intake.status === missedCallAssistantStatuses.readyForOwner
  ).length
  const completedCount = intakes.filter(
    (intake) => intake.status === missedCallAssistantStatuses.completed
  ).length
  const schedulingRequestedCount = intakes.filter(
    (intake) => intake.schedulingRequested
  ).length
  const quoteRequestedCount = intakes.filter(
    (intake) => intake.quoteRequested
  ).length

  return {
    totalCount: intakes.length,
    inProgressCount,
    readyCount,
    completedCount,
    schedulingRequestedCount,
    quoteRequestedCount,
  }
}
