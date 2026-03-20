import { stripe } from "@/lib/stripe"

type PaymentState = "success" | "pending" | "invalid" | "error"

function getItemName(metadata: Record<string, string>) {
  if (metadata.itemType === "credit") {
    const amount = Number(metadata.creditAmount || 0)
    return amount > 0 ? `크레딧 ${amount}개` : "크레딧"
  }

  if (metadata.itemType === "plan") {
    return metadata.planName || "Pro 30일권"
  }

  if (metadata.refName) {
    return metadata.refName
  }

  return ""
}

export default async function PaymentSuccess({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams

  let state: PaymentState = "success"
  let itemName = ""

  if (!session_id) {
    state = "invalid"
  } else {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id)
      const metadata = (session.metadata ?? {}) as Record<string, string>

      itemName = getItemName(metadata)

      if (session.payment_status !== "paid") {
        state = "pending"
      }

      // TODO: Keep fulfillment authoritative in the Stripe webhook only.
      // This page must remain read-only and should never grant entitlements.
    } catch (error) {
      console.error("결제 상태 조회 오류:", error)
      state = "error"
    }
  }

  const title =
    state === "success"
      ? "결제 완료!"
      : state === "pending"
        ? "결제 확인 중입니다"
        : state === "invalid"
          ? "잘못된 결제 링크입니다"
          : "처리 상태를 확인하지 못했습니다"

  const description =
    state === "success"
      ? itemName
        ? `${itemName} 구매가 확인되었습니다. 반영까지 잠시 걸릴 수 있어요.`
        : "구매가 확인되었습니다. 반영까지 잠시 걸릴 수 있어요."
      : state === "pending"
        ? "결제는 접수되었지만 서버 반영까지 잠시 걸릴 수 있습니다. 잠시 후 메인 화면에서 다시 확인해주세요."
        : state === "invalid"
          ? "session_id가 없거나 올바르지 않아 결제 상태를 확인할 수 없습니다."
          : "결제 반영은 서버 webhook에서 처리됩니다. 잠시 후 메인 화면에서 다시 확인해주세요."

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#080810",
        color: "#fff",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 48, marginBottom: 16 }}>
        {state === "success" ? "🎉" : state === "pending" ? "⏳" : "⚠️"}
      </h1>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{title}</h2>
      <p style={{ color: "rgba(255,255,255,0.68)", maxWidth: 460, lineHeight: 1.6 }}>{description}</p>
      <p style={{ color: "rgba(255,255,255,0.42)", marginTop: 12, fontSize: 14, maxWidth: 460, lineHeight: 1.6 }}>
        실제 지급과 권한 부여는 서버에서 Stripe webhook으로 처리됩니다.
      </p>
      <a
        href="/main"
        style={{
          marginTop: 24,
          padding: "12px 24px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff",
          textDecoration: "none",
        }}
      >
        영상통화 화면으로 돌아가기
      </a>
    </div>
  )
}
