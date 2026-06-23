import type { Prisma } from "@prisma/client"
import { getIntegrationStatuses, getLaunchReadinessScore } from "@/lib/config/integration-status"
import { prisma } from "@/lib/data/prisma"
import {
  billingStatuses,
  communicationStatuses,
  missedCallAssistantReviewStatuses,
  missedCallAssistantStatuses,
  leadStatuses,
  missedCallStatuses,
  openLeadStatuses,
  opsJobStatuses,
} from "@/lib/domain/status"
import { getIndustryAiTemplate } from "@/services/ai/industry-templates"
import { getGrowthReadinessStats } from "@/services/modules/seo"

type Jsonify<T> = T extends Date
  ? string
  : T extends string | number | boolean | null
    ? T
    : T extends undefined
      ? undefined
      : T extends Array<infer U>
        ? Jsonify<U>[]
        : T extends object
          ? { [K in keyof T]: Jsonify<T[K]> }
          : T

function toSerializable<T>(value: T): Jsonify<T> {
  return JSON.parse(JSON.stringify(value)) as Jsonify<T>
}

type AdminClientDetailBusiness = Prisma.BusinessGetPayload<{
  include: {
    user: {
      select: {
        id: true
        email: true
        createdAt: true
      }
    }
    _count: {
      select: {
        leads: true
        missedCalls: true
        reviewRequests: true
        serviceOfferings: true
        availabilityWindows: true
        teamMembers: true
        growthTasks: true
        marketingCalendarItems: true
        serviceOpportunities: true
        websiteAuditRuns: true
        growthPlans: true
        aiUsageLogs: true
        internalAssignments: true
        internalClientNotes: true
        opsJobRuns: true
        smsMessages: true
        emailLogs: true
        securityEvents: true
      }
    }
    serviceOfferings: true
    availabilityWindows: true
    teamMembers: true
    leads: {
      include: {
        reviewRequests: true
        missedCallAssistantIntakes: true
      }
    }
    missedCalls: {
      include: {
        convertedLead: {
          select: {
            id: true
            customerName: true
            status: true
          }
        }
        missedCallAssistantIntake: {
          select: {
            id: true
            status: true
            nextAction: true
          }
        }
        routingAttempts: true
      }
    }
    reviewRequests: {
      include: {
        lead: {
          select: {
            id: true
            customerName: true
          }
        }
      }
    }
    followUpSteps: {
      include: {
        lead: {
          select: {
            id: true
            customerName: true
            customerPhone: true
          }
        }
      }
    }
    growthTasks: true
    marketingCalendarItems: true
    serviceOpportunities: true
    websiteAuditRuns: {
      include: {
        findings: true
      }
    }
    websiteAuditFindings: true
    growthPlans: true
    aiUsageLogs: true
    internalAssignments: {
      include: {
        worker: {
          select: {
            id: true
            name: true
            email: true
            role: true
          }
        }
      }
    }
    internalClientNotes: {
      include: {
        worker: {
          select: {
            id: true
            name: true
            email: true
          }
        }
      }
    }
    opsJobRuns: true
    smsMessages: {
      include: {
        missedCall: {
          select: {
            id: true
            callerName: true
            callerPhone: true
          }
        }
      }
    }
    emailLogs: true
    securityEvents: true
  }
}>

export function parseOptionalAdminDate(value: string | undefined) {
  if (value === undefined) {
    return undefined
  }

  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? undefined : date
}

export async function getAdminOperationsDashboard() {
  const integrationStatuses = getIntegrationStatuses()
  const launchReadinessScore = getLaunchReadinessScore(integrationStatuses)

  const [
    userCount,
    businessCount,
    activeClientCount,
    leadCount,
    missedCallCount,
    reviewRequestCount,
    workerCount,
    openAssignmentCount,
    contentDraftCount,
    missedCallAssistantReviewCount,
    aiUsageSummary,
    businesses,
    workers,
    assignments,
    growthTasks,
    serviceOpportunities,
    websiteAuditFindings,
    contentDrafts,
    missedCallAssistantReviewQueue,
    aiUsageLogs,
    internalNotes,
    opsJobs,
    emailLogs,
    smsMessages,
    securityEventCount,
    securityEvents,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.business.count(),
    prisma.business.count({
      where: {
        billingStatus: {
          in: [billingStatuses.trialing, billingStatuses.active],
        },
      },
    }),
    prisma.lead.count(),
    prisma.missedCall.count(),
    prisma.reviewRequest.count(),
    prisma.internalWorker.count(),
    prisma.internalTaskAssignment.count({
      where: {
        status: {
          not: "DONE",
        },
      },
    }),
    prisma.marketingCalendarItem.count({
      where: {
        status: {
          in: ["DRAFT", "NEEDS_APPROVAL"],
        },
      },
    }),
    prisma.missedCallAssistantIntake.count({
      where: {
        status: {
          in: [missedCallAssistantStatuses.readyForOwner, missedCallAssistantStatuses.completed],
        },
        adminReviewStatus: {
          not: missedCallAssistantReviewStatuses.approved,
        },
      },
    }),
    prisma.aiUsageLog.aggregate({
      _count: {
        _all: true,
      },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        estimatedCostCents: true,
      },
    }),
    prisma.business.findMany({
      orderBy: {
        id: "desc",
      },
      take: 25,
      include: {
        user: {
          select: {
            email: true,
          },
        },
        _count: {
          select: {
            leads: true,
            missedCalls: true,
            reviewRequests: true,
            growthTasks: true,
            marketingCalendarItems: true,
            serviceOpportunities: true,
            websiteAuditRuns: true,
            growthPlans: true,
            aiUsageLogs: true,
            internalAssignments: true,
            internalClientNotes: true,
            securityEvents: true,
          },
        },
      },
    }),
    prisma.internalWorker.findMany({
      orderBy: [
        {
          status: "asc",
        },
        {
          name: "asc",
        },
      ],
      include: {
        _count: {
          select: {
            assignments: true,
            clientNotes: true,
          },
        },
      },
    }),
    prisma.internalTaskAssignment.findMany({
      orderBy: [
        {
          status: "asc",
        },
        {
          dueAt: "asc",
        },
        {
          updatedAt: "desc",
        },
      ],
      take: 30,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            selectedPlan: true,
            billingStatus: true,
          },
        },
        worker: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.growthTask.findMany({
      where: {
        status: {
          not: "DONE",
        },
      },
      orderBy: [
        {
          dueAt: "asc",
        },
        {
          priority: "asc",
        },
      ],
      take: 12,
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.serviceOpportunity.findMany({
      where: {
        status: "OPEN",
      },
      orderBy: [
        {
          priority: "asc",
        },
        {
          updatedAt: "desc",
        },
      ],
      take: 12,
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.websiteAuditFinding.findMany({
      where: {
        status: "OPEN",
        severity: {
          in: ["HIGH", "MEDIUM"],
        },
      },
      orderBy: [
        {
          severity: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 12,
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.marketingCalendarItem.findMany({
      where: {
        status: {
          in: ["DRAFT", "NEEDS_APPROVAL"],
        },
      },
      orderBy: [
        {
          scheduledFor: "asc",
        },
        {
          updatedAt: "desc",
        },
      ],
      take: 12,
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.missedCallAssistantIntake.findMany({
      where: {
        status: {
          in: [missedCallAssistantStatuses.readyForOwner, missedCallAssistantStatuses.completed],
        },
        adminReviewStatus: {
          not: missedCallAssistantReviewStatuses.approved,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 16,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            businessType: true,
            selectedPlan: true,
            city: true,
            state: true,
          },
        },
        missedCall: {
          select: {
            id: true,
            callerName: true,
            callerPhone: true,
            reason: true,
            status: true,
            createdAt: true,
            calledPhoneNumber: true,
            routedToPhoneNumber: true,
          },
        },
        lead: {
          select: {
            id: true,
            customerName: true,
            customerPhone: true,
            status: true,
            followUpNote: true,
          },
        },
        matchedService: {
          select: {
            id: true,
            name: true,
            category: true,
            bookableOnline: true,
            ownerConfirmRequired: true,
          },
        },
      },
    }),
    prisma.aiUsageLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 14,
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.internalClientNote.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 14,
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
        worker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.opsJobRun.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 14,
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.emailLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            email: true,
          },
        },
      },
    }),
    prisma.smsMessage.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
        missedCall: {
          select: {
            id: true,
            callerName: true,
            callerPhone: true,
          },
        },
      },
    }),
    prisma.securityEvent.count({
      where: {
        outcome: {
          in: ["FAILURE", "BLOCKED"],
        },
      },
    }),
    prisma.securityEvent.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 18,
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            email: true,
          },
        },
      },
    }),
  ])
  const missedCallAssistantReviewQueueWithTemplates = missedCallAssistantReviewQueue.map((intake) => {
    const template = getIndustryAiTemplate(intake.business.businessType)

    return {
      ...intake,
      template: {
        label: template.label,
        intakeFocus: template.intakeFocus,
        urgencySignals: template.urgencySignals,
        ownerReviewTriggers: template.ownerReviewTriggers,
      },
    }
  })

  return toSerializable({
    generatedAt: new Date().toISOString(),
    counts: {
      users: userCount,
      businesses: activeClientCount,
      totalBusinesses: businessCount,
      leads: leadCount,
      missedCalls: missedCallCount,
      reviewRequests: reviewRequestCount,
      workers: workerCount,
      openAssignments: openAssignmentCount,
      contentDrafts: contentDraftCount,
      missedCallAssistantReviews: missedCallAssistantReviewCount,
      aiUsageLogs: aiUsageSummary._count._all,
      securityEvents: securityEventCount,
    },
    aiUsageSummary: {
      inputTokens: aiUsageSummary._sum.inputTokens ?? 0,
      outputTokens: aiUsageSummary._sum.outputTokens ?? 0,
      estimatedCostCents: aiUsageSummary._sum.estimatedCostCents ?? 0,
    },
    integrationStatuses,
    launchReadinessScore,
    businesses,
    workers,
    assignments,
    growthTasks,
    serviceOpportunities,
    websiteAuditFindings,
    contentDrafts,
    missedCallAssistantReviewQueue: missedCallAssistantReviewQueueWithTemplates,
    aiUsageLogs,
    internalNotes,
    opsJobs,
    emailLogs,
    smsMessages,
    securityEvents,
  })
}

export type AdminOperationsDashboardData = Awaited<
  ReturnType<typeof getAdminOperationsDashboard>
>

export async function getAdminClientDetail(businessId: string) {
  const businessResult = await prisma.business.findUnique({
    where: {
      id: businessId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          leads: true,
          missedCalls: true,
          reviewRequests: true,
          serviceOfferings: true,
          availabilityWindows: true,
          teamMembers: true,
          growthTasks: true,
          marketingCalendarItems: true,
          serviceOpportunities: true,
          websiteAuditRuns: true,
          growthPlans: true,
          aiUsageLogs: true,
          internalAssignments: true,
          internalClientNotes: true,
          opsJobRuns: true,
          smsMessages: true,
          emailLogs: true,
          securityEvents: true,
        },
      },
      serviceOfferings: {
        orderBy: {
          displayOrder: "asc",
        },
        take: 8,
      },
      availabilityWindows: {
        orderBy: [
          {
            dayOfWeek: "asc",
          },
          {
            startTime: "asc",
          },
        ],
        take: 8,
      },
      teamMembers: {
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
      },
      leads: {
        orderBy: {
          createdAt: "desc",
        },
        take: 12,
        include: {
          reviewRequests: true,
          missedCallAssistantIntakes: {
            orderBy: {
              updatedAt: "desc",
            },
            take: 1,
          },
        },
      },
      missedCalls: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        include: {
          convertedLead: {
            select: {
              id: true,
              customerName: true,
              status: true,
            },
          },
          missedCallAssistantIntake: {
            select: {
              id: true,
              status: true,
              nextAction: true,
            },
          },
          routingAttempts: {
            orderBy: {
              routeOrder: "asc",
            },
            take: 5,
          },
        },
      },
      reviewRequests: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        include: {
          lead: {
            select: {
              id: true,
              customerName: true,
            },
          },
        },
      },
      followUpSteps: {
        orderBy: [
          {
            dueAt: "asc",
          },
          {
            stepOrder: "asc",
          },
        ],
        take: 12,
        include: {
          lead: {
            select: {
              id: true,
              customerName: true,
              customerPhone: true,
            },
          },
        },
      },
      growthTasks: {
        orderBy: [
          {
            status: "asc",
          },
          {
            dueAt: "asc",
          },
          {
            updatedAt: "desc",
          },
        ],
        take: 12,
      },
      marketingCalendarItems: {
        orderBy: [
          {
            scheduledFor: "asc",
          },
          {
            updatedAt: "desc",
          },
        ],
        take: 12,
      },
      serviceOpportunities: {
        orderBy: [
          {
            status: "asc",
          },
          {
            priority: "asc",
          },
          {
            updatedAt: "desc",
          },
        ],
        take: 10,
      },
      websiteAuditRuns: {
        orderBy: {
          checkedAt: "desc",
        },
        take: 5,
        include: {
          findings: {
            orderBy: {
              createdAt: "desc",
            },
            take: 5,
          },
        },
      },
      websiteAuditFindings: {
        where: {
          status: "OPEN",
        },
        orderBy: [
          {
            severity: "asc",
          },
          {
            createdAt: "desc",
          },
        ],
        take: 10,
      },
      growthPlans: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
      },
      aiUsageLogs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
      internalAssignments: {
        orderBy: [
          {
            status: "asc",
          },
          {
            dueAt: "asc",
          },
          {
            updatedAt: "desc",
          },
        ],
        take: 12,
        include: {
          worker: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
      internalClientNotes: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        include: {
          worker: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      opsJobRuns: {
        orderBy: {
          createdAt: "desc",
        },
        take: 12,
      },
      smsMessages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        include: {
          missedCall: {
            select: {
              id: true,
              callerName: true,
              callerPhone: true,
            },
          },
        },
      },
      emailLogs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
      securityEvents: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
  })
  const business = businessResult as AdminClientDetailBusiness | null

  if (!business) {
    return null
  }

  const [
    capturedLeadAggregate,
    openLeadAggregate,
    closedLeadAggregate,
    missedCallTotalCount,
    missedCallRepliedCount,
    reviewReceivedCount,
    activeJobCount,
    failedJobCount,
    aiUsageSummary,
  ] = await Promise.all([
    prisma.lead.aggregate({
      where: {
        businessId,
        OR: [
          {
            status: leadStatuses.captured,
          },
          {
            status: leadStatuses.closed,
            capturedValueCents: {
              gt: 0,
            },
          },
        ],
      },
      _count: {
        _all: true,
      },
      _sum: {
        capturedValueCents: true,
      },
    }),
    prisma.lead.aggregate({
      where: {
        businessId,
        status: {
          in: [...openLeadStatuses],
        },
      },
      _count: {
        _all: true,
      },
      _sum: {
        capturedValueCents: true,
        estimatedValueCents: true,
      },
    }),
    prisma.lead.aggregate({
      where: {
        businessId,
        status: leadStatuses.closed,
      },
      _count: {
        _all: true,
      },
      _sum: {
        capturedValueCents: true,
        estimatedValueCents: true,
      },
    }),
    prisma.missedCall.count({
      where: {
        businessId,
      },
    }),
    prisma.missedCall.count({
      where: {
        businessId,
        status: missedCallStatuses.replied,
      },
    }),
    prisma.reviewRequest.count({
      where: {
        businessId,
        status: communicationStatuses.received,
      },
    }),
    prisma.opsJobRun.count({
      where: {
        businessId,
        status: {
          in: [
            opsJobStatuses.queued,
            opsJobStatuses.running,
            opsJobStatuses.retrying,
          ],
        },
      },
    }),
    prisma.opsJobRun.count({
      where: {
        businessId,
        status: opsJobStatuses.failed,
      },
    }),
    prisma.aiUsageLog.aggregate({
      where: {
        businessId,
      },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        estimatedCostCents: true,
      },
    }),
  ])

  const growthStats = getGrowthReadinessStats(business)
  const setupChecks = [
    {
      label: "Business profile",
      ready: Boolean(
        business.name &&
          business.phone &&
          business.address &&
          business.city &&
          business.state &&
          business.zip
      ),
      href: "#profile",
      summary: "Name, phone, address, city, state, and ZIP.",
    },
    {
      label: "Digital presence",
      ready: growthStats.digitalPresenceComplete,
      href: "#growth",
      summary: `${growthStats.digitalPresenceReadyCount}/${growthStats.digitalPresenceTotalCount} presence items ready.`,
    },
    {
      label: "Services",
      ready: business._count.serviceOfferings > 0,
      href: "#services",
      summary: `${business._count.serviceOfferings} services configured.`,
    },
    {
      label: "Availability",
      ready: business._count.availabilityWindows > 0,
      href: "#services",
      summary: `${business._count.availabilityWindows} availability windows configured.`,
    },
    {
      label: "Automation rules",
      ready: Boolean(business.callbackTimeframe && business.quoteDisclaimer),
      href: "#automation",
      summary: business.phoneAutomationEnabled
        ? "Missed-call automation is enabled."
        : "Missed-call automation is not enabled yet.",
    },
    {
      label: "Reviews",
      ready: Boolean(business.googleReviewUrl || business._count.reviewRequests > 0),
      href: "#reviews",
      summary: business.googleReviewUrl || "Google review link is not set.",
    },
  ]
  const incompleteSetupChecks = setupChecks.filter((item) => !item.ready)
  const openAssignments = business.internalAssignments.filter(
    (assignment) => assignment.status !== "DONE"
  )
  const waitingContentDrafts = business.marketingCalendarItems.filter((item) =>
    ["DRAFT", "NEEDS_APPROVAL"].includes(item.status)
  )
  const nextActions = [
    ...(incompleteSetupChecks.length > 0
      ? [
          {
            label: "Setup",
            title: `${incompleteSetupChecks[0]?.label} needs attention`,
            detail: incompleteSetupChecks[0]?.summary ?? "",
            href: incompleteSetupChecks[0]?.href ?? "/settings/launch",
            tone: "amber",
          },
        ]
      : []),
    ...(failedJobCount > 0
      ? [
          {
            label: "Automation",
            title: `${failedJobCount} failed job${failedJobCount === 1 ? "" : "s"}`,
            detail: "Review the latest job errors and retry anything safe.",
            href: "#jobs",
            tone: "rose",
          },
        ]
      : []),
    ...(openAssignments.length > 0
      ? [
          {
            label: "Internal work",
            title: `${openAssignments.length} open task${
              openAssignments.length === 1 ? "" : "s"
            }`,
            detail: "Assign or complete the client work that is still open.",
            href: "#work",
            tone: "amber",
          },
        ]
      : []),
    ...(waitingContentDrafts.length > 0
      ? [
          {
            label: "Marketing",
            title: `${waitingContentDrafts.length} draft${
              waitingContentDrafts.length === 1 ? "" : "s"
            } waiting`,
            detail: "Review draft content or schedule approved campaign items.",
            href: "#marketing",
            tone: "slate",
          },
        ]
      : []),
    ...(business._count.leads === 0
      ? [
          {
            label: "CRM",
            title: "No leads captured yet",
            detail: "Seed demo data or connect intake/SMS sources for this client.",
            href: "/leads",
            tone: "slate",
          },
        ]
      : []),
  ].slice(0, 5)

  return toSerializable({
    generatedAt: new Date().toISOString(),
    ownerEmail: business.user.email,
    business,
    metrics: {
      capturedLeadCount: capturedLeadAggregate._count._all,
      capturedRevenueCents:
        capturedLeadAggregate._sum.capturedValueCents ?? 0,
      openLeadCount: openLeadAggregate._count._all,
      openLeadValueCents: openLeadAggregate._sum.estimatedValueCents ?? 0,
      closedLeadCount: closedLeadAggregate._count._all,
      closedLeadValueCents:
        (closedLeadAggregate._sum.capturedValueCents ?? 0) ||
        (closedLeadAggregate._sum.estimatedValueCents ?? 0),
      missedCallTotalCount,
      missedCallRepliedCount,
      reviewReceivedCount,
      activeJobCount,
      failedJobCount,
      aiInputTokens: aiUsageSummary._sum.inputTokens ?? 0,
      aiOutputTokens: aiUsageSummary._sum.outputTokens ?? 0,
      aiEstimatedCostCents: aiUsageSummary._sum.estimatedCostCents ?? 0,
    },
    setupChecks,
    nextActions,
  })
}

export type AdminClientDetailData = NonNullable<
  Awaited<ReturnType<typeof getAdminClientDetail>>
>

export async function createInternalWorker(data: {
  name: string
  email: string
  role: string
  status: string
}) {
  return prisma.internalWorker.create({
    data,
  })
}

export async function updateInternalWorker(
  id: string,
  data: {
    name?: string
    role?: string
    status?: string
  }
) {
  return prisma.internalWorker.update({
    where: {
      id,
    },
    data,
  })
}

export async function createInternalAssignment(data: {
  businessId: string
  workerId?: string | null
  title: string
  description: string
  category: string
  status: string
  priority: string
  dueAt?: Date | null
}) {
  return prisma.internalTaskAssignment.create({
    data: {
      businessId: data.businessId,
      workerId: data.workerId || null,
      title: data.title,
      description: data.description,
      category: data.category,
      status: data.status,
      priority: data.priority,
      dueAt: data.dueAt,
    },
  })
}

export async function updateInternalAssignment(
  id: string,
  data: {
    workerId?: string | null
    title?: string
    description?: string
    category?: string
    status?: string
    priority?: string
    dueAt?: Date | null
  }
) {
  return prisma.internalTaskAssignment.update({
    where: {
      id,
    },
    data,
  })
}

export async function createAdminGrowthTask(data: {
  businessId: string
  title: string
  description: string
  category: string
  status: string
  priority: string
  source: string
  dueAt?: Date | null
}) {
  return prisma.growthTask.create({
    data: {
      businessId: data.businessId,
      title: data.title,
      description: data.description,
      category: data.category,
      status: data.status,
      priority: data.priority,
      source: data.source,
      dueAt: data.dueAt,
    },
  })
}

export async function createAdminMarketingCalendarItem(data: {
  businessId: string
  title: string
  channel: string
  campaignGoal: string
  contentTheme: string
  offer: string
  status: string
  scheduledFor?: Date | null
  notes: string
}) {
  return prisma.marketingCalendarItem.create({
    data: {
      businessId: data.businessId,
      title: data.title,
      channel: data.channel,
      campaignGoal: data.campaignGoal,
      contentTheme: data.contentTheme,
      offer: data.offer,
      status: data.status,
      scheduledFor: data.scheduledFor,
      notes: data.notes,
    },
  })
}

export async function createInternalClientNote(data: {
  businessId: string
  workerId?: string | null
  category: string
  body: string
  authorEmail: string
}) {
  return prisma.internalClientNote.create({
    data: {
      businessId: data.businessId,
      workerId: data.workerId || null,
      category: data.category,
      body: data.body,
      authorEmail: data.authorEmail,
    },
  })
}

export async function createOpsJobRun(data: {
  businessId?: string | null
  name: string
  kind: string
  status: string
  source: string
  details: string
  scheduledFor?: Date | null
}) {
  return prisma.opsJobRun.create({
    data: {
      businessId: data.businessId || null,
      name: data.name,
      kind: data.kind,
      status: data.status,
      source: data.source,
      details: data.details,
      scheduledFor: data.scheduledFor,
    },
  })
}

export async function updateOpsJobRun(
  id: string,
  data: {
    status?: string
    details?: string
    error?: string
    scheduledFor?: Date | null
    startedAt?: Date | null
    finishedAt?: Date | null
  }
) {
  return prisma.opsJobRun.update({
    where: {
      id,
    },
    data,
  })
}

export async function updateAdminBusinessFields(
  id: string,
  data: {
    selectedPlan?: string
    billingStatus?: string
    onboardingComplete?: boolean
    contactName?: string
    contactPhonePrimary?: string
    contactPhoneSecondary?: string
  }
) {
  return prisma.business.update({
    where: {
      id,
    },
    data,
  })
}

export async function updateAdminContentDraft(
  id: string,
  data: {
    status?: string
    scheduledFor?: Date | null
    notes?: string
  }
) {
  return prisma.marketingCalendarItem.update({
    where: {
      id,
    },
    data,
  })
}
