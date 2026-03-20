import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { stripe } from "@/lib/stripe"

type CheckoutRequest = {
  productKey?: string
  itemType?: string
  refName?: string
  planName?: string
  creditAmount?: number
  itemName?: string
  price?: number
  userId?: string
  avatarCategory?: string
}

type CatalogProduct = {
  key: string
  itemType: "plan" | "credit" | "avatar" | "celeb"
  name: string
  description: string
  unitAmount: number
  refName: string
  avatarCategory?: string
  creditAmount?: number
  planName?: string
}

const USD_1 = 100

const PRODUCT_CATALOG: Record<string, CatalogProduct> = {
  "plan:pro_30d": {
    key: "plan:pro_30d",
    itemType: "plan",
    name: "Pro 30일권",
    description: "30일 동안 Pro 기능을 이용할 수 있는 일회성 상품",
    unitAmount: USD_1,
    refName: "Pro",
    planName: "Pro",
  },
  "credits:50": {
    key: "credits:50",
    itemType: "credit",
    name: "통화 크레딧 50회",
    description: "통화 크레딧 50회를 충전합니다",
    unitAmount: USD_1,
    refName: "credits",
    creditAmount: 50,
  },
  "avatar:기본": {
    key: "avatar:기본",
    itemType: "avatar",
    name: "기본 아바타",
    description: "기본 아바타를 계정에 추가합니다",
    unitAmount: USD_1,
    refName: "기본",
    avatarCategory: "MASK",
  },
  "avatar:고양이": {
    key: "avatar:고양이",
    itemType: "avatar",
    name: "고양이 아바타",
    description: "고양이 아바타를 계정에 추가합니다",
    unitAmount: USD_1,
    refName: "고양이",
    avatarCategory: "ANIMAL",
  },
  "avatar:여우": {
    key: "avatar:여우",
    itemType: "avatar",
    name: "여우 아바타",
    description: "여우 아바타를 계정에 추가합니다",
    unitAmount: USD_1,
    refName: "여우",
    avatarCategory: "ANIMAL",
  },
  "avatar:로봇": {
    key: "avatar:로봇",
    itemType: "avatar",
    name: "로봇 아바타",
    description: "로봇 아바타를 계정에 추가합니다",
    unitAmount: USD_1,
    refName: "로봇",
    avatarCategory: "MASK",
  },
  "avatar:문어": {
    key: "avatar:문어",
    itemType: "avatar",
    name: "문어 아바타",
    description: "문어 아바타를 계정에 추가합니다",
    unitAmount: USD_1,
    refName: "문어",
    avatarCategory: "ANIMAL",
  },
  "avatar:사자": {
    key: "avatar:사자",
    itemType: "avatar",
    name: "사자 아바타",
    description: "사자 아바타를 계정에 추가합니다",
    unitAmount: USD_1,
    refName: "사자",
    avatarCategory: "ANIMAL",
  },
  "avatar:에일리언": {
    key: "avatar:에일리언",
    itemType: "avatar",
    name: "에일리언 아바타",
    description: "에일리언 아바타를 계정에 추가합니다",
    unitAmount: USD_1,
    refName: "에일리언",
    avatarCategory: "MASK",
  },
  "avatar:호박": {
    key: "avatar:호박",
    itemType: "avatar",
    name: "호박 아바타",
    description: "호박 아바타를 계정에 추가합니다",
    unitAmount: USD_1,
    refName: "호박",
    avatarCategory: "MASK",
  },
  "avatar:곰인형": {
    key: "avatar:곰인형",
    itemType: "avatar",
    name: "곰인형 아바타",
    description: "곰인형 아바타를 계정에 추가합니다",
    unitAmount: USD_1,
    refName: "곰인형",
    avatarCategory: "ANIMAL",
  },
  "avatar:호랑이 아바타": {
    key: "avatar:호랑이 아바타",
    itemType: "avatar",
    name: "호랑이 아바타",
    description: "호랑이 아바타를 계정에 추가합니다",
    unitAmount: USD_1,
    refName: "호랑이 아바타",
    avatarCategory: "ANIMAL",
  },
  "avatar:여우 아바타": {
    key: "avatar:여우 아바타",
    itemType: "avatar",
    name: "여우 아바타",
    description: "여우 아바타를 계정에 추가합니다",
    unitAmount: USD_1,
    refName: "여우 아바타",
    avatarCategory: "ANIMAL",
  },
  "avatar:미스터리 가면": {
    key: "avatar:미스터리 가면",
    itemType: "avatar",
    name: "미스터리 가면",
    description: "미스터리 가면 아바타를 계정에 추가합니다",
    unitAmount: USD_1,
    refName: "미스터리 가면",
    avatarCategory: "MASK",
  },
  "avatar:로봇 아바타": {
    key: "avatar:로봇 아바타",
    itemType: "avatar",
    name: "로봇 아바타",
    description: "로봇 아바타를 계정에 추가합니다",
    unitAmount: USD_1,
    refName: "로봇 아바타",
    avatarCategory: "MASK",
  },
  "celeb:장원영": {
    key: "celeb:장원영",
    itemType: "celeb",
    name: "장원영 셀럽 AI",
    description: "장원영 셀럽 AI 아바타를 계정에 추가합니다",
    unitAmount: USD_1,
    refName: "장원영",
    avatarCategory: "HUMAN",
  },
  "celeb:뷔": {
    key: "celeb:뷔",
    itemType: "celeb",
    name: "뷔 셀럽 AI",
    description: "뷔 셀럽 AI 아바타를 계정에 추가합니다",
    unitAmount: USD_1,
    refName: "뷔",
    avatarCategory: "HUMAN",
  },
  "celeb:카리나": {
    key: "celeb:카리나",
    itemType: "celeb",
    name: "카리나 셀럽 AI",
    description: "카리나 셀럽 AI 아바타를 계정에 추가합니다",
    unitAmount: USD_1,
    refName: "카리나",
    avatarCategory: "HUMAN",
  },
  "celeb:차은우": {
    key: "celeb:차은우",
    itemType: "celeb",
    name: "차은우 셀럽 AI",
    description: "차은우 셀럽 AI 아바타를 계정에 추가합니다",
    unitAmount: USD_1,
    refName: "차은우",
    avatarCategory: "HUMAN",
  },
  "celeb:윈터": {
    key: "celeb:윈터",
    itemType: "celeb",
    name: "윈터 셀럽 AI",
    description: "윈터 셀럽 AI 아바타를 계정에 추가합니다",
    unitAmount: USD_1,
    refName: "윈터",
    avatarCategory: "HUMAN",
  },
  "celeb:지민": {
    key: "celeb:지민",
    itemType: "celeb",
    name: "지민 셀럽 AI",
    description: "지민 셀럽 AI 아바타를 계정에 추가합니다",
    unitAmount: USD_1,
    refName: "지민",
    avatarCategory: "HUMAN",
  },
}

function resolveLegacyProductKey(body: CheckoutRequest): string | null {
  if (typeof body.productKey === "string" && body.productKey in PRODUCT_CATALOG) {
    return body.productKey
  }

  if (body.itemType === "plan" && (body.planName === "Pro" || body.refName === "Pro")) {
    return "plan:pro_30d"
  }

  if (body.itemType === "credit" && Number(body.creditAmount) === 50) {
    return "credits:50"
  }

  if (body.itemType === "avatar" && typeof body.refName === "string") {
    const key = `avatar:${body.refName}`
    return key in PRODUCT_CATALOG ? key : null
  }

  if (body.itemType === "celeb" && typeof body.refName === "string") {
    const key = `celeb:${body.refName}`
    return key in PRODUCT_CATALOG ? key : null
  }

  return null
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
    }

    const sessionUser = session.user as { id?: string; email?: string | null }
    let userId = sessionUser.id

    if (!userId && sessionUser.email) {
      const { prisma } = await import("@/lib/prisma")
      const user = await prisma.user.findUnique({
        where: { email: sessionUser.email },
        select: { id: true },
      })
      userId = user?.id
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Authenticated user not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      )
    }

    const body = (await req.json()) as CheckoutRequest
    const productKey = resolveLegacyProductKey(body)

    if (!productKey) {
      return NextResponse.json(
        { error: "Invalid checkout product", code: "INVALID_PRODUCT" },
        { status: 400 }
      )
    }

    const product = PRODUCT_CATALOG[productKey]
    const baseUrl = process.env.NEXTAUTH_URL ?? new URL(req.url).origin

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment/cancel`,
      client_reference_id: userId,
      customer_email: sessionUser.email ?? undefined,
      metadata: {
        userId,
        productKey: product.key,
        itemType: product.itemType,
        refName: product.refName,
        avatarCategory: product.avatarCategory ?? "",
        creditAmount: product.creditAmount != null ? String(product.creditAmount) : "",
        planName: product.planName ?? "",
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create checkout session", code: "CHECKOUT_CREATE_FAILED" },
      { status: 500 }
    )
  }
}
