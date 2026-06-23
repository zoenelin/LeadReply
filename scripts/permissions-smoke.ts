import { createHash } from "node:crypto"
import bcrypt from "bcrypt"

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

async function main() {
  const { prisma } = await import("../src/lib/data/prisma")
  const {
    getBusinessAccessForSession,
    hasBusinessCapability,
  } = await import("../src/services/auth/business-access")
  const { roleCan } = await import("../src/lib/security/permissions")
  const { toCustomerJobSavedView } = await import(
    "../src/services/crm/customer-job-views"
  )
  const { POST: acceptInvite } = await import(
    "../src/app/api/team-invitations/accept/route"
  )
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const ownerEmail = `permissions-owner-${runId}@example.com`
  const staffEmail = `permissions-staff-${runId}@example.com`
  const inviteCode = "341829"
  let ownerId = ""
  let staffUserId = ""
  let businessId = ""

  try {
    const owner = await prisma.user.create({
      data: {
        email: ownerEmail,
        password: await bcrypt.hash("owner-password", 10),
      },
    })
    ownerId = owner.id

    const business = await prisma.business.create({
      data: {
        name: "Permissions Smoke Test",
        phone: "555-0100",
        businessType: "HOME_SERVICES",
        userId: owner.id,
      },
    })
    businessId = business.id

    await prisma.teamInvitation.create({
      data: {
        businessId: business.id,
        invitedByUserId: owner.id,
        email: staffEmail,
        role: "OFFICE",
        tokenHash: hashSecret(`token-${runId}`),
        codeHash: hashSecret(inviteCode),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    assert(roleCan("OWNER", "manageBilling"), "Owner should manage billing.")
    assert(roleCan("OFFICE", "manageLeads"), "Office should manage leads.")
    assert(
      !roleCan("OFFICE", "manageBilling"),
      "Office should not manage billing."
    )

    const acceptResponse = await acceptInvite(
      new Request("http://localhost/api/team-invitations/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: staffEmail,
          code: inviteCode,
          name: "Office Staff",
          password: "staff-password",
        }),
      })
    )

    assert(acceptResponse.ok, "Expected invite-code acceptance to succeed.")

    const staffUser = await prisma.user.findUnique({
      where: {
        email: staffEmail,
      },
    })

    assert(staffUser, "Expected invite acceptance to create staff user.")
    staffUserId = staffUser!.id

    const membership = await prisma.businessMembership.findUnique({
      where: {
        businessId_userId: {
          businessId: business.id,
          userId: staffUser!.id,
        },
      },
    })

    assert(membership, "Expected staff membership to be created.")
    assert(membership?.status === "ACTIVE", "Expected membership to be active.")
    assert(membership?.role === "OFFICE", "Expected office role.")

    const ownerAccess = await getBusinessAccessForSession({
      user: {
        id: owner.id,
        email: owner.email,
      },
    } as never)
    const staffAccess = await getBusinessAccessForSession({
      user: {
        id: staffUser!.id,
        email: staffUser!.email,
      },
    } as never)

    assert(ownerAccess?.isOwner, "Expected owner access to resolve.")
    assert(staffAccess && !staffAccess.isOwner, "Expected staff access.")
    assert(
      hasBusinessCapability(staffAccess!, "manageLeads"),
      "Expected staff to manage leads."
    )
    assert(
      !hasBusinessCapability(staffAccess!, "manageBilling"),
      "Expected staff not to manage billing."
    )

    const crmView = await prisma.businessCrmView.create({
      data: {
        businessId: business.id,
        createdByUserId: owner.id,
        name: "Current jobs",
        filters: {
          viewFilter: "CURRENT",
          sourceFilter: "ALL",
          searchTerm: "",
        },
        visibleColumns: ["customer", "service", "status", "nextStep", "open"],
        sortKey: "FOLLOW_UP",
      },
    })
    const savedView = toCustomerJobSavedView(crmView)

    assert(savedView.name === "Current jobs", "Expected CRM view name.")
    assert(
      savedView.visibleColumns.includes("nextStep"),
      "Expected saved CRM columns."
    )
    assert(savedView.sortKey === "FOLLOW_UP", "Expected saved CRM sort.")

    console.log("Permission smoke checks passed.")
  } finally {
    if (businessId) {
      await prisma.businessCrmView.deleteMany({ where: { businessId } })
      await prisma.teamInvitation.deleteMany({ where: { businessId } })
      await prisma.teamMember.deleteMany({ where: { businessId } })
      await prisma.businessMembership.deleteMany({ where: { businessId } })
      await prisma.securityEvent.deleteMany({ where: { businessId } })
      await prisma.business.deleteMany({ where: { id: businessId } })
    }

    if (staffUserId) {
      await prisma.user.deleteMany({ where: { id: staffUserId } })
    }

    if (ownerId) {
      await prisma.user.deleteMany({ where: { id: ownerId } })
    }

    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
