import { runWebsiteAudit } from "@/lib/growth/website-audit"
import { prisma } from "@/lib/data/prisma"

function taskCategoryForFinding(category: string) {
  if (
    category === "SEO" ||
    category === "LOCAL_SEO" ||
    category === "CONTENT" ||
    category === "MOBILE"
  ) {
    return "SEO"
  }

  return "GENERAL"
}

function taskPriorityForSeverity(severity: string) {
  if (severity === "HIGH" || severity === "LOW") {
    return severity
  }

  return "MEDIUM"
}

export async function runWebsiteAuditJob({
  businessId,
}: {
  businessId: string
}) {
  const business = await prisma.business.findUnique({
    where: {
      id: businessId,
    },
  })

  if (!business) {
    throw new Error("Business not found for website audit.")
  }

  const result = await runWebsiteAudit({
    website: business.website,
    businessName: business.name,
    city: business.city,
    state: business.state,
    services: business.seoPrimaryServices,
    phone: business.phone,
  })
  const auditRun = await prisma.websiteAuditRun.create({
    data: {
      businessId: business.id,
      targetUrl: result.targetUrl,
      score: result.score,
      summary: result.summary,
      findings: {
        create: result.findings.map((finding) => ({
          businessId: business.id,
          category: finding.category,
          severity: finding.severity,
          title: finding.title,
          description: finding.description,
          recommendation: finding.recommendation,
        })),
      },
    },
    include: {
      findings: true,
    },
  })
  const taskFindings = auditRun.findings.filter(
    (finding) => finding.severity === "HIGH" || finding.severity === "MEDIUM"
  )

  if (taskFindings.length > 0) {
    await prisma.growthTask.createMany({
      data: taskFindings.map((finding) => ({
        businessId: business.id,
        title: finding.title,
        description: finding.recommendation || finding.description,
        category: taskCategoryForFinding(finding.category),
        priority: taskPriorityForSeverity(finding.severity),
        source: "AUDIT",
      })),
      skipDuplicates: true,
    })
  }

  return {
    auditRunId: auditRun.id,
    score: auditRun.score,
    findingsCreated: auditRun.findings.length,
    tasksCreated: taskFindings.length,
  }
}
