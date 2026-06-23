import { createHash } from "node:crypto"
import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/data/prisma"
import { businessRoleLabels } from "@/lib/security/permissions"
import { InviteAcceptForm } from "./InviteAcceptForm"

export const metadata: Metadata = {
  title: "Team Invite",
  description: "Review a LeadReply team invitation.",
  robots: {
    index: false,
    follow: false,
  },
}

type InvitePageProps = {
  params: Promise<{
    token: string
  }>
}

function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

function formatDate(value: Date) {
  return value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default async function TeamInvitePage({ params }: InvitePageProps) {
  const { token } = await params
  const invitation = await prisma.teamInvitation.findUnique({
    where: {
      tokenHash: hashSecret(token),
    },
    include: {
      business: {
        select: {
          name: true,
        },
      },
    },
  })
  const now = new Date()
  const inviteUnavailable =
    !invitation ||
    invitation.status !== "PENDING" ||
    Boolean(invitation.revokedAt) ||
    Boolean(invitation.acceptedAt) ||
    invitation.expiresAt <= now
  const roleLabel =
    invitation && invitation.role in businessRoleLabels
      ? businessRoleLabels[
          invitation.role as keyof typeof businessRoleLabels
        ]
      : invitation?.role

  return (
    <main className="min-h-screen bg-lr-page px-4 py-10">
      <div className="mx-auto max-w-xl rounded-2xl border border-lr-border bg-lr-surface p-6 shadow-sm sm:p-8">
        <Link
          href="/"
          className="text-sm font-black uppercase tracking-wide text-emerald-700"
        >
          LeadReply
        </Link>

        {inviteUnavailable ? (
          <section className="mt-8">
            <h1 className="text-3xl font-black text-lr-strong">
              Invite unavailable
            </h1>
            <p className="mt-3 text-sm leading-6 text-lr-muted">
              This invite may be expired, already used, or no longer active.
              Ask the business owner to generate a fresh invite from Team
              settings.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex rounded-xl bg-lr-primary px-5 py-3 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover"
            >
              Go to sign in
            </Link>
          </section>
        ) : (
          <section className="mt-8">
            <p className="text-sm font-bold uppercase tracking-wide text-lr-subtle">
              Team invitation
            </p>
            <h1 className="mt-2 text-3xl font-black text-lr-strong">
              Join {invitation.business.name}
            </h1>
            <p className="mt-3 text-sm leading-6 text-lr-muted">
              You have been invited as{" "}
              <span className="font-bold text-lr-strong">
                {roleLabel}
              </span>
              . Create your staff login or enter the password for your existing
              staff account to join this workspace.
            </p>

            <div className="mt-6 space-y-3 rounded-2xl border border-lr-border bg-lr-surface-muted p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-lr-subtle">
                  Invited email
                </p>
                <p className="mt-1 font-bold text-lr-strong">
                  {invitation.email}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-lr-subtle">
                  Expires
                </p>
                <p className="mt-1 font-bold text-lr-strong">
                  {formatDate(invitation.expiresAt)}
                </p>
              </div>
            </div>

            <InviteAcceptForm token={token} email={invitation.email} />

            <Link
              href="/invite"
              className="mt-4 inline-flex text-sm font-bold text-lr-muted hover:text-lr-strong"
            >
              Have a 6-digit invite code instead?
            </Link>
          </section>
        )}
      </div>
    </main>
  )
}
