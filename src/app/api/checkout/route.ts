// 변경 이유: donor의 서버 소유 결제 카탈로그 로직을 현재 Auth.js v5 구조에 맞춰 이식해 클라이언트 입력을 신뢰하지 않도록 보강했습니다.
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { getCatalogProduct, type CheckoutRequest, resolveProductKeyFromCheckout } from "@/lib/payment-catalog"
import { getStripe } from "@/lib/stripe"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
  }

  try {
    const stripe = getStripe()
    const body = (await req.json()) as CheckoutRequest
    const productKey = resolveProductKeyFromCheckout(body)
    if (!productKey) {
      return NextResponse.json(
        { error: "Invalid checkout product", code: "INVALID_PRODUCT" },
        { status: 400 }
      )
    }

    const product = getCatalogProduct(productKey)
    if (!product) {
      return NextResponse.json(
        { error: "Checkout product not found", code: "PRODUCT_NOT_FOUND" },
        { status: 404 }
      )
    }

    const userId = session.user.id
    if (!userId) {
      return NextResponse.json(
        { error: "Authenticated user not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      )
    }

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
      customer_email: session.user.email ?? undefined,
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
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "결제 세션 생성 중 오류가 발생했습니다"

    return NextResponse.json(
      { error: message, code: "CHECKOUT_CREATE_FAILED" },
      { status: 500 }
    )
  }
}
