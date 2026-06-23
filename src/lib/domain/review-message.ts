type ReviewMessageBusiness = {
  name: string
  googleReviewUrl: string
  reviewDiscountEnabled: boolean
  reviewDiscountOffer: string
}

export function getDefaultReviewRequestMessage(businessName: string) {
  return `Thanks for choosing ${businessName}. Would you mind leaving us a quick review?`
}

export function buildReviewRequestMessage({
  business,
  message,
}: {
  business: ReviewMessageBusiness
  message: string
}) {
  const trimmedMessage =
    message.trim() || getDefaultReviewRequestMessage(business.name)
  const parts = [trimmedMessage]
  const reviewUrl = business.googleReviewUrl.trim()
  const discountOffer = business.reviewDiscountOffer.trim()

  if (reviewUrl && !trimmedMessage.includes(reviewUrl)) {
    parts.push(`Review link: ${reviewUrl}`)
  }

  if (
    business.reviewDiscountEnabled &&
    discountOffer &&
    !trimmedMessage.includes(discountOffer)
  ) {
    parts.push(
      `Thank-you offer: ${discountOffer} for leaving an honest review. This is not tied to a positive rating.`
    )
  }

  return parts.join("\n\n")
}
