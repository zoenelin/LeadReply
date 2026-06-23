import { getServerSession } from "next-auth"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/data/prisma"
import { buildNotifications } from "@/lib/domain/notifications"
import { roleCapabilities } from "@/lib/security/permissions"
import { getBusinessAccessForSession } from "@/services/auth/business-access"
import { AppNavClient } from "@/components/AppNavClient"

export async function AppNav() {
  const session = await getServerSession(authOptions)
  const access = session ? await getBusinessAccessForSession(session) : null
  const capabilities = access
    ? [
        ...new Set([
          ...roleCapabilities[access.role],
          ...access.customPermissions,
        ]),
      ]
    : null
  const todayEnd = new Date()

  todayEnd.setHours(23, 59, 59, 999)

  const [leads, missedCalls, missedCallAssistantIntakes, reviewRequests, followUpSteps] =
    access
      ? await Promise.all([
          prisma.lead.findMany({
            where: {
              businessId: access.businessId,
            },
            select: {
              id: true,
              customerName: true,
              customerPhone: true,
              status: true,
              followUpAt: true,
              followUpCompletedAt: true,
              createdAt: true,
              reviewRequests: {
                select: {
                  id: true,
                  status: true,
                },
              },
            },
            take: 100,
          }),
          prisma.missedCall.findMany({
            where: {
              businessId: access.businessId,
            },
            select: {
              id: true,
              callerName: true,
              callerPhone: true,
              status: true,
              createdAt: true,
            },
            take: 100,
          }),
          prisma.missedCallAssistantIntake.findMany({
            where: {
              businessId: access.businessId,
            },
            include: {
              missedCall: {
                select: {
                  callerName: true,
                  callerPhone: true,
                },
              },
              lead: {
                select: {
                  id: true,
                },
              },
            },
            orderBy: {
              updatedAt: "desc",
            },
            take: 100,
          }),
          prisma.reviewRequest.findMany({
            where: {
              businessId: access.businessId,
            },
            select: {
              id: true,
              customerName: true,
              status: true,
              createdAt: true,
              leadId: true,
            },
            take: 100,
          }),
          prisma.followUpStep.findMany({
            where: {
              businessId: access.businessId,
            },
            include: {
              lead: {
                select: {
                  id: true,
                  customerName: true,
                },
              },
            },
            take: 100,
          }),
        ])
      : [[], [], [], [], []]
  const notifications = buildNotifications({
    leads,
    missedCalls,
    missedCallAssistantIntakes,
    reviewRequests,
    followUpSteps,
    now: todayEnd,
  })

  return (
    <AppNavClient
      capabilities={capabilities}
      notificationCount={notifications.length}
      highPriorityNotificationCount={
        notifications.filter((notification) => notification.priority === "HIGH")
          .length
      }
    />
  )
}
