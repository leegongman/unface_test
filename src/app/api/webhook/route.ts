import { NextResponse } from "next/server"
import { headers } from "next/headers"
import type { Prisma } from "@prisma/client"
import { stripe } from "@/lib/stripe"

type Product =
  | {
      key: string
      itemType: "plan"
      planName: string
      durationDays: number
    }
  | {
      key: string
      itemType: "credit"
      creditAmount: number
    }
  | {
      key: string
      itemType: "avatar" | "celeb"
      refName: string
      avatarCategory: string
      isPremium: boolean
    }

const PRODUCT_CATALOG: Record<string, Product> = {
  "plan:pro_30d": {
    key: "plan:pro_30d",
    itemType: "plan",
    planName: "Pro",
    durationDays: 30,
  },
  "credits:50": {
    key: "credits:50",
    itemType: "credit",
    creditAmount: 50,
  },
  "avatar:기본": {
    key: "avatar:기본",
    itemType: "avatar",
    refName: "기본",
    avatarCategory: "MASK",
    isPremium: false,
  },
  "avatar:고양이": {
    key: "avatar:고양이",
    itemType: "avatar",
    refName: "고양이",
    avatarCategory: "ANIMAL",
    isPremium: false,
  },
  "avatar:여우": {
    key: "avatar:여우",
    itemType: "avatar",
    refName: "여우",
    avatarCategory: "ANIMAL",
    isPremium: false,
  },
  "avatar:로봇": {
    key: "avatar:로봇",
    itemType: "avatar",
    refName: "로봇",
    avatarCategory: "MASK",
    isPremium: false,
  },
  "avatar:문어": {
    key: "avatar:문어",
    itemType: "avatar",
    refName: "문어",
    avatarCategory: "ANIMAL",
    isPremium: false,
  },
  "avatar:사자": {
    key: "avatar:사자",
    itemType: "avatar",
    refName: "사자",
    avatarCategory: "ANIMAL",
    isPremium: false,
  },
  "avatar:에일리언": {
    key: "avatar:에일리언",
    itemType: "avatar",
    refName: "에일리언",
    avatarCategory: "MASK",
    isPremium: false,
  },
  "avatar:호박": {
    key: "avatar:호박",
    itemType: "avatar",
    refName: "호박",
    avatarCategory: "MASK",
    isPremium: false,
  },
  "avatar:곰인형": {
    key: "avatar:곰인형",
    itemType: "avatar",
    refName: "곰인형",
    avatarCategory: "ANIMAL",
    isPremium: false,
  },
  "avatar:호랑이 아바타": {
    key: "avatar:호랑이 아바타",
    itemType: "avatar",
    refName: "호랑이 아바타",
    avatarCategory: "ANIMAL",
    isPremium: false,
  },
  "avatar:여우 아바타": {
    key: "avatar:여우 아바타",
    itemType: "avatar",
    refName: "여우 아바타",
    avatarCategory: "ANIMAL",
    isPremium: false,
  },
  "avatar:미스터리 가면": {
    key: "avatar:미스터리 가면",
    itemType: "avatar",
    refName: "미스터리 가면",
    avatarCategory: "MASK",
    isPremium: false,
  },
  "avatar:로봇 아바타": {
    key: "avatar:로봇 아바타",
    itemType: "avatar",
    refName: "로봇 아바타",
    avatarCategory: "MASK",
    isPremium: false,
  },
  "celeb:장원영": {
    key: "celeb:장원영",
    itemType: "celeb",
    refName: "장원영",
    avatarCategory: "HUMAN",
    isPremium: true,
  },
  "celeb:뷔": {
    key: "celeb:뷔",
    itemType: "celeb",
    refName: "뷔",
    avatarCategory: "HUMAN",
    isPremium: true,
  },
  "celeb:카리나": {
    key: "celeb:카리나",
    itemType: "celeb",
    refName: "카리나",
    avatarCategory: "HUMAN",
    isPremium: true,
  },
  "celeb:차은우": {
    key: "celeb:차은우",
    itemType: "celeb",
    refName: "차은우",
    avatarCategory: "HUMAN",
    isPremium: true,
  },
  "celeb:윈터": {
    key: "celeb:윈터",
    itemType: "celeb",
    refName: "윈터",
    avatarCategory: "HUMAN",
    isPremium: true,
  },
  "celeb:지민": {
    key: "celeb:지민",
    itemType: "celeb",
    refName: "지민",
    avatarCategory: "HUMAN",
    isPremium: true,
  },
}

function resolveLegacyProductKey(metadata: Record<string, string>) {
  if (metadata.itemType === "plan" && (metadata.planName === "Pro" || metadata.refName === "Pro")) {
    return "plan:pro_30d"
  }

  if (metadata.itemType === "credit" && Number(metadata.creditAmount) === 50) {
    return "credits:50"
  }

  if (metadata.itemType === "avatar" && metadata.refName) {
    const key = `avatar:${metadata.refName}`
    return key in PRODUCT_CATALOG ? key : null
  }

  if (metadata.itemType === "celeb" && metadata.refName) {
    const key = `celeb:${metadata.refName}`
    return key in PRODUCT_CATALOG ? key : null
  }

  return null
}

function resolveProduct(metadata: Record<string, string>) {
  if (metadata.productKey) {
    return PRODUCT_CATALOG[metadata.productKey] ?? null
  }

  const legacyKey = resolveLegacyProductKey(metadata)
  return legacyKey ? PRODUCT_CATALOG[legacyKey] : null
}

async function fulfillProduct(
  tx: Prisma.TransactionClient,
  params: { userId: string; product: Product; fulfillmentKey: string; sessionId: string }
) {
  const { userId, product, fulfillmentKey, sessionId } = params

  if (product.itemType === "avatar" || product.itemType === "celeb") {
    let avatar = await tx.avatar.findFirst({
      where: { name: product.refName },
    })

    if (!avatar) {
      avatar = await tx.avatar.create({
        data: {
          name: product.refName,
          category: product.avatarCategory,
          priceCredits: 1,
          isPremium: product.isPremium,
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
    await tx.user.update({
      where: { id: userId },
      data: { creditBalance: { increment: product.creditAmount } },
    })

    await tx.creditTransaction.create({
      data: {
        userId,
        amount: product.creditAmount,
        type: "PURCHASE",
        refType: "credit",
        description: fulfillmentKey,
      },
    })

    return
  }

  if (product.itemType === "plan") {
    let plan = await tx.subscriptionPlan.findFirst({
      where: { name: product.planName },
    })

    if (!plan) {
      plan = await tx.subscriptionPlan.create({
        data: { name: product.planName, priceMonthly: 1 },
      })
    } else if (plan.priceMonthly !== 1) {
      plan = await tx.subscriptionPlan.update({
        where: { id: plan.id },
        data: { priceMonthly: 1 },
      })
    }

    await tx.userSubscription.updateMany({
      where: { userId, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    })

    const now = new Date()
    const end = new Date(now.getTime() + product.durationDays * 24 * 60 * 60 * 1000)

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

  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as any

  if (session.mode !== "payment" || session.payment_status !== "paid" || session.status !== "complete") {
    return NextResponse.json({ received: true })
  }

  const metadata = (session.metadata ?? {}) as Record<string, string>
  const userId = metadata.userId

  if (!userId) {
    return NextResponse.json({ error: "Missing userId in metadata" }, { status: 500 })
  }

  const product = resolveProduct(metadata)
  if (!product) {
    return NextResponse.json({ error: "Unknown or invalid checkout product metadata" }, { status: 500 })
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
        product,
        fulfillmentKey,
        sessionId: session.id,
      })

      // TODO: Add DB-level uniqueness for creditTransaction.description and
      // userSubscription.providerSubId to make idempotency resilient even outside this code path.
      return true
    })

    return NextResponse.json({ received: true, processed })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Webhook fulfillment failed" },
      { status: 500 }
    )
  }
}
