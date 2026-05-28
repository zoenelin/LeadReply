import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { absoluteUrl, noIndexRobots } from "@/lib/site"
import { LeadWidget } from "./LeadWidget"

type WidgetPageProps = {
  params: Promise<{
    businessId: string
  }>
}

export async function generateMetadata({
  params,
}: WidgetPageProps): Promise<Metadata> {
  const { businessId } = await params
  const business = await prisma.business.findUnique({
    where: {
      id: businessId,
    },
    select: {
      name: true,
    },
  })

  return {
    title: business ? `${business.name} Contact Widget` : "Contact Widget",
    description: "Embedded LeadReply contact widget for callback and text requests.",
    alternates: {
      canonical: absoluteUrl(`/widget/${businessId}`),
    },
    robots: noIndexRobots,
  }
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
