import bcrypt from "bcrypt"
import { prisma } from "@/lib/data/prisma"
import {
  appointmentStatuses,
  communicationStatuses,
  leadStatuses,
  opsJobStatuses,
} from "@/lib/domain/status"
import {
  getIndustryAvailabilityPresets,
  getIndustryServicePresets,
} from "@/lib/domain/industry-presets"
import { buildServiceOpportunities } from "@/lib/growth/digital-presence"

const defaultAdminEmail = "zoe.nelin@me.com"
const defaultDevPassword = "LeadReplyDemo123!"
const businessType = "PLUMBING"

function readSeedAdminEmail() {
  const firstAdminEmail = process.env.ADMIN_EMAILS?.split(",")[0]?.trim()

  return (
    process.env.SEED_ADMIN_EMAIL?.trim() ||
    firstAdminEmail ||
    defaultAdminEmail
  ).toLowerCase()
}

function assertLocalDatabase() {
  const databaseUrl = process.env.DATABASE_URL ?? ""
  const allowNonLocal = process.env.ALLOW_NONLOCAL_SEED === "true"
  const isLocal =
    databaseUrl.includes("localhost") ||
    databaseUrl.includes("127.0.0.1") ||
    databaseUrl.includes("leadreply-postgres")

  if (!isLocal && !allowNonLocal) {
    throw new Error(
      "Refusing to seed a non-local database. Set ALLOW_NONLOCAL_SEED=true if this is intentional."
    )
  }
}

function daysFromNow(days: number, hour = 10) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, 0, 0, 0)
  return date
}

function monthsAgo(months: number, day: number, hour = 10) {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() - months, day, hour, 0, 0)
}

async function createOrUpdateSeedUser(email: string) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  })
  const password =
    process.env.SEED_ADMIN_PASSWORD ||
    process.env.LEADREPLY_ADMIN_PASSWORD ||
    (existingUser ? "" : defaultDevPassword)

  if (existingUser && !password) {
    return {
      user: existingUser,
      passwordChanged: false,
      usedDefaultPassword: false,
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.upsert({
    where: {
      email,
    },
    update: {
      password: hashedPassword,
      role: "OWNER",
      themePreference: "DARK",
    },
    create: {
      email,
      password: hashedPassword,
      role: "OWNER",
      themePreference: "DARK",
    },
  })

  return {
    user,
    passwordChanged: true,
    usedDefaultPassword: password === defaultDevPassword,
  }
}

async function resetBusinessDemoData(businessId: string) {
  await prisma.$transaction([
    prisma.smsMessage.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.opsJobRun.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.missedCallAssistantIntake.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.followUpStep.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.reviewRequest.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.teamNote.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.customerActivity.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.job.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.missedCall.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.lead.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.customer.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.marketingCampaign.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.marketingCalendarItem.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.growthTask.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.websiteAuditFinding.deleteMany({
      where: {
        auditRun: {
          businessId,
        },
      },
    }),
    prisma.websiteAuditRun.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.growthPlan.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.serviceOpportunity.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.internalClientNote.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.internalTaskAssignment.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.businessCrmView.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.availabilityWindow.deleteMany({
      where: {
        businessId,
      },
    }),
    prisma.serviceOffering.deleteMany({
      where: {
        businessId,
      },
    }),
  ])
}

async function seedBusiness(userId: string) {
  const business = await prisma.business.upsert({
    where: {
      userId,
    },
    update: {
      name: "LeadReply Demo Home Services",
      phone: "(555) 201-4420",
      contactName: "Zoe Nelin",
      contactPhonePrimary: "(555) 201-4420",
      contactPhoneSecondary: "(555) 201-4421",
      website: "https://example.com",
      address: "120 Main Street",
      city: "Milwaukee",
      state: "WI",
      zip: "53202",
      businessType,
      selectedPlan: "COMPLETE",
      bookingNotes:
        "Customers can request weekday appointments. Owner confirms final schedule.",
      phoneAutomationEnabled: true,
      bookingAutomationEnabled: true,
      quoteEstimateEnabled: true,
      reviewAutomationEnabled: true,
      reviewDiscountEnabled: true,
      reviewDiscountOffer: "10% off a future maintenance visit",
      seoPrimaryServices: "plumbing repair, water heater repair, drain cleaning",
      seoServiceAreas: "Milwaukee, Wauwatosa, West Allis",
      marketingChannels: "Google Business Profile, Facebook, email",
      marketingContentThemes:
        "Preventive maintenance, seasonal plumbing tips, emergency preparedness",
      marketingPostingCadence: "weekly",
      marketingBrandVoice: "Helpful, direct, trustworthy",
      billingStatus: "TRIALING",
      calendarProvider: "Manual",
      calendarBookingUrl: "https://example.com/book",
      googleReviewUrl: "https://example.com/reviews",
      websitePresenceStatus: "CONNECTED",
      googleBusinessProfileStatus: "NEEDS_WORK",
      facebookPageStatus: "MISSING",
      instagramProfileStatus: "NOT_NEEDED",
      bookingLinkStatus: "CONNECTED",
      reviewPlatformStatus: "CONNECTED",
      brandAssetsStatus: "NEEDS_WORK",
      wantsLeadReplySetupHelp: true,
      onboardingComplete: true,
      replyTemplate:
        "Thanks for calling. What plumbing issue are you dealing with, and what time works best for a quick callback?",
    },
    create: {
      name: "LeadReply Demo Home Services",
      phone: "(555) 201-4420",
      contactName: "Zoe Nelin",
      contactPhonePrimary: "(555) 201-4420",
      contactPhoneSecondary: "(555) 201-4421",
      website: "https://example.com",
      address: "120 Main Street",
      city: "Milwaukee",
      state: "WI",
      zip: "53202",
      businessType,
      selectedPlan: "COMPLETE",
      bookingNotes:
        "Customers can request weekday appointments. Owner confirms final schedule.",
      phoneAutomationEnabled: true,
      bookingAutomationEnabled: true,
      quoteEstimateEnabled: true,
      reviewAutomationEnabled: true,
      reviewDiscountEnabled: true,
      reviewDiscountOffer: "10% off a future maintenance visit",
      seoPrimaryServices: "plumbing repair, water heater repair, drain cleaning",
      seoServiceAreas: "Milwaukee, Wauwatosa, West Allis",
      marketingChannels: "Google Business Profile, Facebook, email",
      marketingContentThemes:
        "Preventive maintenance, seasonal plumbing tips, emergency preparedness",
      marketingPostingCadence: "weekly",
      marketingBrandVoice: "Helpful, direct, trustworthy",
      billingStatus: "TRIALING",
      calendarProvider: "Manual",
      calendarBookingUrl: "https://example.com/book",
      googleReviewUrl: "https://example.com/reviews",
      websitePresenceStatus: "CONNECTED",
      googleBusinessProfileStatus: "NEEDS_WORK",
      facebookPageStatus: "MISSING",
      instagramProfileStatus: "NOT_NEEDED",
      bookingLinkStatus: "CONNECTED",
      reviewPlatformStatus: "CONNECTED",
      brandAssetsStatus: "NEEDS_WORK",
      wantsLeadReplySetupHelp: true,
      onboardingComplete: true,
      replyTemplate:
        "Thanks for calling. What plumbing issue are you dealing with, and what time works best for a quick callback?",
      userId,
    },
  })

  await resetBusinessDemoData(business.id)

  await prisma.serviceOffering.createMany({
    data: getIndustryServicePresets(businessType).map((service) => ({
      ...service,
      businessId: business.id,
    })),
  })
  await prisma.availabilityWindow.createMany({
    data: getIndustryAvailabilityPresets(businessType).map((window) => ({
      ...window,
      startTime: window.startTime === "09:00" ? "08:00" : window.startTime,
      businessId: business.id,
    })),
  })

  const businessWithServices = await prisma.business.findUniqueOrThrow({
    where: {
      id: business.id,
    },
    include: {
      serviceOfferings: {
        orderBy: {
          displayOrder: "asc",
        },
      },
    },
  })
  const service = businessWithServices.serviceOfferings[0]
  const campaign = await prisma.marketingCampaign.create({
    data: {
      businessId: business.id,
      name: "Spring emergency plumbing",
      channel: "Google Business Profile",
      goal: "More booked plumbing calls",
      status: "ACTIVE",
      costCents: 18500,
      notes: "Demo campaign used to show ROI and source tracking.",
      startsAt: monthsAgo(1, 1, 8),
      endsAt: daysFromNow(20, 18),
    },
  })

  const [sarah, marcus, elena, tony] = await Promise.all([
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: "Sarah Johnson",
        phone: "(555) 310-1188",
        email: "sarah@example.com",
        address: "44 Oak Lane",
        city: "Milwaukee",
        state: "WI",
        zip: "53203",
        notes: "Prefers morning callbacks.",
      },
    }),
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: "Marcus Lee",
        phone: "(555) 428-7710",
        email: "marcus@example.com",
        address: "18 Lake View Drive",
        city: "Wauwatosa",
        state: "WI",
        zip: "53213",
      },
    }),
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: "Elena Rivera",
        phone: "(555) 804-2331",
        email: "elena@example.com",
        address: "92 Pine Court",
        city: "West Allis",
        state: "WI",
        zip: "53214",
      },
    }),
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: "Tony Miller",
        phone: "(555) 912-0044",
        address: "12 Cedar Avenue",
        city: "Milwaukee",
        state: "WI",
        zip: "53204",
      },
    }),
  ])

  const lead1 = await prisma.lead.create({
    data: {
      businessId: business.id,
      customerId: sarah.id,
      serviceOfferingId: service.id,
      marketingCampaignId: campaign.id,
      customerName: sarah.name,
      customerPhone: sarah.phone,
      customerEmail: sarah.email,
      source: "MISSED_CALL",
      sourceDetail: "After-hours call",
      status: leadStatuses.current,
      estimatedValueCents: 42500,
      notes: "Kitchen sink leak. Customer wants a callback this morning.",
      followUpAt: daysFromNow(0, 11),
      appointmentStatus: appointmentStatuses.requested,
      createdAt: daysFromNow(-1, 18),
    },
  })
  const lead2 = await prisma.lead.create({
    data: {
      businessId: business.id,
      customerId: marcus.id,
      serviceOfferingId: service.id,
      marketingCampaignId: campaign.id,
      customerName: marcus.name,
      customerPhone: marcus.phone,
      customerEmail: marcus.email,
      source: "WEBSITE",
      sourceDetail: "Widget form",
      status: leadStatuses.captured,
      estimatedValueCents: 68000,
      capturedValueCents: 68000,
      appointmentStatus: appointmentStatuses.booked,
      appointmentAt: daysFromNow(1, 14),
      notes: "Water heater diagnostic booked.",
      createdAt: monthsAgo(0, 9, 14),
    },
  })
  const lead3 = await prisma.lead.create({
    data: {
      businessId: business.id,
      customerId: elena.id,
      customerName: elena.name,
      customerPhone: elena.phone,
      customerEmail: elena.email,
      source: "MANUAL",
      sourceDetail: "Owner entered",
      status: leadStatuses.closed,
      estimatedValueCents: 24000,
      capturedValueCents: 24000,
      appointmentStatus: appointmentStatuses.completed,
      closedAt: daysFromNow(-1, 16),
      notes: "Drain clearing completed. Review request ready.",
      createdAt: monthsAgo(1, 18, 10),
    },
  })
  const lead4 = await prisma.lead.create({
    data: {
      businessId: business.id,
      customerId: tony.id,
      customerName: tony.name,
      customerPhone: tony.phone,
      source: "MISSED_CALL",
      sourceDetail: "Emergency line",
      status: leadStatuses.new,
      estimatedValueCents: 70000,
      notes: "Possible urgent leak. Needs review.",
      createdAt: daysFromNow(0, 8),
    },
  })

  const job1 = await prisma.job.create({
    data: {
      businessId: business.id,
      customerId: sarah.id,
      leadId: lead1.id,
      serviceOfferingId: service.id,
      marketingCampaignId: campaign.id,
      title: "Kitchen sink leak",
      status: leadStatuses.current,
      source: "MISSED_CALL",
      estimatedValueCents: 42500,
      notes: "Needs callback and scheduling confirmation.",
      followUpAt: daysFromNow(0, 11),
      appointmentStatus: appointmentStatuses.requested,
    },
  })
  const job2 = await prisma.job.create({
    data: {
      businessId: business.id,
      customerId: marcus.id,
      leadId: lead2.id,
      serviceOfferingId: service.id,
      marketingCampaignId: campaign.id,
      title: "Water heater diagnostic",
      status: leadStatuses.captured,
      source: "WEBSITE",
      estimatedValueCents: 68000,
      capturedValueCents: 68000,
      appointmentStatus: appointmentStatuses.booked,
      appointmentAt: daysFromNow(1, 14),
    },
  })
  const job3 = await prisma.job.create({
    data: {
      businessId: business.id,
      customerId: elena.id,
      leadId: lead3.id,
      title: "Drain clearing",
      status: leadStatuses.closed,
      source: "MANUAL",
      estimatedValueCents: 24000,
      capturedValueCents: 24000,
      appointmentStatus: appointmentStatuses.completed,
      closedAt: daysFromNow(-1, 16),
    },
  })
  const job4 = await prisma.job.create({
    data: {
      businessId: business.id,
      customerId: tony.id,
      leadId: lead4.id,
      title: "Urgent leak triage",
      status: leadStatuses.new,
      source: "MISSED_CALL",
      estimatedValueCents: 70000,
      notes: "AI text-back started. Waiting for customer reply.",
    },
  })

  await prisma.customerActivity.createMany({
    data: [
      {
        businessId: business.id,
        customerId: sarah.id,
        leadId: lead1.id,
        jobId: job1.id,
        type: "NOTE",
        title: "AI text-back started",
        body: "Customer replied and asked for morning availability.",
        authorName: "LeadReply",
        source: "SYSTEM",
      },
      {
        businessId: business.id,
        customerId: marcus.id,
        leadId: lead2.id,
        jobId: job2.id,
        type: "NOTE",
        title: "Booking captured",
        body: "Appointment is booked for tomorrow afternoon.",
        authorName: "LeadReply",
        source: "SYSTEM",
      },
      {
        businessId: business.id,
        customerId: elena.id,
        leadId: lead3.id,
        jobId: job3.id,
        type: "NOTE",
        title: "Job closed",
        body: "Service completed and review request drafted.",
        authorName: "LeadReply",
        source: "SYSTEM",
      },
      {
        businessId: business.id,
        customerId: tony.id,
        leadId: lead4.id,
        jobId: job4.id,
        type: "NOTE",
        title: "Needs owner review",
        body: "Potential emergency. Confirm availability before quoting.",
        authorName: "LeadReply",
        source: "SYSTEM",
      },
    ],
  })

  const missedCall = await prisma.missedCall.create({
    data: {
      businessId: business.id,
      callerName: "Tony Miller",
      callerPhone: tony.phone,
      reason: "Emergency leak question",
      status: "NEW",
      convertedLeadId: lead4.id,
      calledPhoneNumber: business.phone,
      routedToPhoneNumber: business.contactPhonePrimary,
      routingLabel: "Primary owner line",
      createdAt: daysFromNow(0, 8),
    },
  })
  await prisma.missedCall.create({
    data: {
      businessId: business.id,
      callerName: "Sarah Johnson",
      callerPhone: sarah.phone,
      reason: "Kitchen sink leak",
      status: "REPLIED",
      convertedLeadId: lead1.id,
      calledPhoneNumber: business.phone,
      routedToPhoneNumber: business.contactPhonePrimary,
      routingLabel: "Primary owner line",
      createdAt: daysFromNow(-1, 18),
      repliedAt: daysFromNow(-1, 18),
    },
  })
  await prisma.missedCallAssistantIntake.create({
    data: {
      businessId: business.id,
      missedCallId: missedCall.id,
      leadId: lead4.id,
      status: "READY_FOR_OWNER",
      intent: "Urgent plumbing help",
      urgency: "High",
      preferredTime: "As soon as possible",
      schedulingRequested: true,
      quoteRequested: true,
      matchedServiceName: service.name,
      matchedQuoteLowCents: service.estimateLowCents,
      matchedQuoteHighCents: service.estimateHighCents,
      matchedDurationMinutes: service.durationMinutes,
      summary: "Caller may have an active leak and needs a fast callback.",
      nextAction: "Owner should confirm availability before final quote.",
      adminReviewStatus: "NEEDS_REVIEW",
      transcript: [
        {
          role: "assistant",
          content:
            "Sorry we missed you. Can you tell us what plumbing issue you are dealing with?",
        },
        {
          role: "customer",
          content: "There is water under the sink and I need help today.",
        },
      ],
    },
  })

  await prisma.reviewRequest.createMany({
    data: [
      {
        businessId: business.id,
        leadId: lead3.id,
        customerName: elena.name,
        customerPhone: elena.phone,
        message:
          "Thanks for choosing us. Would you be willing to leave a quick review?",
        status: communicationStatuses.draft,
      },
      {
        businessId: business.id,
        leadId: lead2.id,
        customerName: marcus.name,
        customerPhone: marcus.phone,
        message:
          "We hope the service was helpful. A review helps other homeowners find us.",
        status: communicationStatuses.sent,
        sentAt: daysFromNow(-1, 12),
      },
    ],
  })

  await prisma.growthTask.createMany({
    data: [
      {
        businessId: business.id,
        title: "Tighten Google Business Profile service list",
        description:
          "Use the service catalog to update GBP services and add plumbing keywords for Milwaukee.",
        category: "SEO",
        status: "TODO",
        priority: "HIGH",
        source: "AUDIT",
        dueAt: daysFromNow(2, 9),
      },
      {
        businessId: business.id,
        title: "Draft spring drain-cleaning post",
        description:
          "Create one practical post that explains warning signs before a drain backup.",
        category: "MARKETING",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        source: "AI_PLAN",
        dueAt: daysFromNow(4, 9),
      },
    ],
  })
  await prisma.marketingCalendarItem.create({
    data: {
      businessId: business.id,
      title: "Spring drain maintenance reminder",
      channel: "Facebook",
      campaignGoal: "Repeat customers",
      contentTheme: "Preventive maintenance",
      offer: business.reviewDiscountOffer,
      status: "DRAFT",
      scheduledFor: daysFromNow(5, 10),
      notes: "Draft for admin review before client approval.",
    },
  })
  const worker = await prisma.internalWorker.upsert({
    where: {
      email: "ops@leadreply.local",
    },
    update: {
      name: "LeadReply Ops",
      role: "OWNER",
      status: "ACTIVE",
    },
    create: {
      name: "LeadReply Ops",
      email: "ops@leadreply.local",
      role: "OWNER",
      status: "ACTIVE",
    },
  })
  await prisma.internalTaskAssignment.create({
    data: {
      businessId: business.id,
      workerId: worker.id,
      title: "Review demo missed-call assistant intake",
      description:
        "Confirm summary, next action, and whether the quote guidance should be edited.",
      category: "AI_REVIEW",
      status: "TODO",
      priority: "HIGH",
      sourceType: "DEMO",
      sourceId: missedCall.id,
      dueAt: daysFromNow(1, 9),
    },
  })
  await prisma.internalClientNote.create({
    data: {
      businessId: business.id,
      workerId: worker.id,
      body: "Demo account is set up with complete-plan features so admin and client flows have realistic data.",
      category: "GENERAL",
      authorEmail: worker.email,
    },
  })
  await prisma.opsJobRun.create({
    data: {
      businessId: business.id,
      name: "Demo missed-call text-back",
      kind: "MISSED_CALL_SMS",
      status: opsJobStatuses.succeeded,
      source: "DEMO",
      queueName: "leadreply-demo",
      queueJobId: "seed-demo-missed-call",
      dedupeKey: `${business.id}:seed-demo-missed-call`,
      details: "Seeded job showing the expected background-worker history.",
      attemptsMade: 1,
      maxAttempts: 3,
      queuedAt: daysFromNow(0, 8),
      startedAt: daysFromNow(0, 8),
      finishedAt: daysFromNow(0, 8),
      result: {
        message: "Demo SMS job completed.",
      },
    },
  })

  const opportunities = buildServiceOpportunities({
    ...business,
    website: "https://example.com",
    googleBusinessProfileUrl: "",
    facebookPageUrl: "",
    instagramProfileUrl: "",
    calendarBookingUrl: "https://example.com/book",
    googleReviewUrl: "https://example.com/reviews",
  })

  if (opportunities.length > 0) {
    await prisma.serviceOpportunity.createMany({
      data: opportunities.map((opportunity) => ({
        ...opportunity,
        businessId: business.id,
      })),
      skipDuplicates: true,
    })
  }

  await prisma.businessCrmView.createMany({
    data: [
      {
        businessId: business.id,
        createdByUserId: userId,
        name: "Open work",
        viewKey: "OPEN_WORK",
        filters: {
          viewFilter: "NEEDS_ATTENTION",
          sourceFilter: "ALL",
          searchTerm: "",
        },
        visibleColumns: ["customer", "phone", "service", "jobStatus", "nextStep", "open"],
        sortKey: "NEWEST",
        sortDirection: "DESC",
      },
      {
        businessId: business.id,
        createdByUserId: userId,
        name: "Booked jobs",
        viewKey: "BOOKED_JOBS",
        filters: {
          viewFilter: "SCHEDULED",
          sourceFilter: "ALL",
          searchTerm: "",
        },
        visibleColumns: ["customer", "phone", "service", "appointment", "moneyMade", "open"],
        sortKey: "FOLLOW_UP",
        sortDirection: "ASC",
      },
    ],
  })

  return business.id
}

async function main() {
  assertLocalDatabase()

  const email = readSeedAdminEmail()
  const { user, passwordChanged, usedDefaultPassword } =
    await createOrUpdateSeedUser(email)
  const businessId = await seedBusiness(user.id)
  const counts = await prisma.business.findUniqueOrThrow({
    where: {
      id: businessId,
    },
    select: {
      name: true,
      _count: {
        select: {
          customers: true,
          jobs: true,
          leads: true,
          missedCalls: true,
          reviewRequests: true,
          growthTasks: true,
          opsJobRuns: true,
        },
      },
    },
  })

  console.log("LeadReply dev seed complete.")
  console.log(`Admin email: ${email}`)
  if (passwordChanged) {
    console.log(
      usedDefaultPassword
        ? "Password: default local dev password was set. Override with SEED_ADMIN_PASSWORD."
        : "Password: updated from SEED_ADMIN_PASSWORD/LEADREPLY_ADMIN_PASSWORD."
    )
  } else {
    console.log("Password: existing password kept.")
  }
  console.log(`Business: ${counts.name}`)
  console.log(JSON.stringify(counts._count, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
