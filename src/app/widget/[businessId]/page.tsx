import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { LeadWidget } from "./LeadWidget"

type WidgetPageProps = {
  params: Promise<{
    businessId: string
  }>
}

export default async function WidgetPage({ params }: WidgetPageProps) {
  const { businessId } = await params
  const business = await prisma.business.findUnique({
    where: {
      id: businessId,
    },
    select: {
      id: true,
      name: true,
      widgetGreeting: true,
      widgetPrimaryAction: true,
      widgetAccentColor: true,
    },
  })

  if (!business) {
    notFound()
  }

  return (
    <LeadWidget
      businessId={business.id}
      business={{
        name: business.name,
        widgetGreeting: business.widgetGreeting,
        widgetPrimaryAction: business.widgetPrimaryAction,
        widgetAccentColor: business.widgetAccentColor,
      }}
    />
  )
}
