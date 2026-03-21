// 변경 이유: donor의 서버 권한 기반 상품 지급 로직을 이식해 webhook을 최종 권한 부여 주체로 통합했습니다.
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { type AvatarCategory, type Prisma } from "@prisma/client"
import { type Stripe } from "stripe"

import { resolveProductFromMetadata } from "@/lib/payment-catalog"
import { getStripe } from "@/lib/stripe"

const avatarCategories = new Set<AvatarCategory>(["ANIMAL", "HUMAN", "MASK"])

function isAvatarCategory(value: string | undefined): value is AvatarCategory {
  return value !== undefined && avatarCategories.has(value as AvatarCategory)
}

async function fulfillProduct(
  tx: Prisma.TransactionClient,
  params: {
    userId: string
    sessionId: string
    product: NonNullable<ReturnType<typeof resolveProductFromMetadata>>
    fulfillmentKey: string
  }
) {
  const { userId, sessionId, product, fulfillmentKey } = params

  if (product.itemType === "avatar" || product.itemType === "celeb") {
    let avatar = await tx.avatar.findFirst({
      where: { name: product.refName },
    })

    if (!avatar) {
      avatar = await tx.avatar.create({
        data: {
          name: product.refName,
          category: product.avatarCategory ?? "MASK",
          priceCredits: 1,
          isPremium: Boolean(product.isPremium),
        },
      })
    }

    await tx.userAvatar.upsert({
      where: { userId_avatarId: { userId, avatarId: avatar.id } },
      update: {},
      create: { userId, avatarId: avatar.id },
    })

    await tx.creditTransaction.create({
      data: {
        userId,
        amount: 1,
        type: "PURCHASE",
        refType: "avatar",
        refId: avatar.id,
        description: fulfillmentKey,
      },
    })

    return
  }

  if (product.itemType === "credit") {
    const amount = product.creditAmount ?? 0

    await tx.user.update({
      where: { id: userId },
      data: { creditBalance: { increment: amount } },
    })

    await tx.creditTransaction.create({
      data: {
        userId,
        amount,
        type: "PURCHASE",
        refType: "credit",
        description: fulfillmentKey,
      },
    })

    return
  }

  if (product.itemType === "plan") {
    let plan = await tx.subscriptionPlan.findFirst({
      where: { name: product.planName ?? "Pro" },
    })

    if (!plan) {
      plan = await tx.subscriptionPlan.create({
        data: {
          name: product.planName ?? "Pro",
          priceMonthly: product.unitAmount / 100,
        },
      })
    } else if (plan.priceMonthly !== product.unitAmount / 100) {
      plan = await tx.subscriptionPlan.update({
        where: { id: plan.id },
        data: { priceMonthly: product.unitAmount / 100 },
      })
    }

    await tx.userSubscription.updateMany({
      where: { userId, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    })

    const now = new Date()
    const end = new Date(
      now.getTime() + (product.durationDays ?? 30) * 24 * 60 * 60 * 1000
    )

    await tx.userSubscription.create({
      data: {
        userId,
        planId: plan.id,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: end,
        paymentProvider: "stripe",
        providerSubId: sessionId,
      },
    })

    await tx.creditTransaction.create({
      data: {
        userId,
        amount: 0,
        type: "PURCHASE",
        refType: "plan",
        description: fulfillmentKey,
      },
    })
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook 검증에 실패했습니다"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  if (
    session.mode !== "payment" ||
    session.payment_status !== "paid" ||
    session.status !== "complete"
  ) {
    return NextResponse.json({ received: true })
  }

  const metadata = Object.fromEntries(
    Object.entries(session.metadata ?? {}).map(([key, value]) => [key, value ?? ""])
  )
  const userId =
    (typeof session.client_reference_id === "string" && session.client_reference_id) ||
    metadata.userId

  if (!userId) {
    return NextResponse.json({ error: "Missing userId in metadata" }, { status: 500 })
  }

  const product = resolveProductFromMetadata(metadata)
  if (!product) {
    return NextResponse.json(
      { error: "Unknown or invalid checkout product metadata" },
      { status: 500 }
    )
  }

  const { prisma } = await import("@/lib/prisma")
  const fulfillmentKey = `stripe:${session.id}`

  try {
    const processed = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${fulfillmentKey}))`

      const alreadyProcessed = await tx.creditTransaction.findFirst({
        where: { description: fulfillmentKey },
      })

      if (alreadyProcessed) {
        return false
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true },
      })

      if (!user) {
        throw new Error("Webhook user not found")
      }

      await fulfillProduct(tx, {
        userId,
        sessionId: session.id,
        product: {
          ...product,
          avatarCategory: isAvatarCategory(product.avatarCategory) ? product.avatarCategory : "MASK",
        },
        fulfillmentKey,
      })

      return true
    })

    return NextResponse.json({ received: true, processed })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook fulfillment failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
