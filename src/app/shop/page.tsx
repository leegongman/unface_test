"use client"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { SessionProvider } from "next-auth/react"
import { useEffect } from "react"

const avatars = [
  { id: "avatar-tiger", name: "호랑이 아바타", price: 3.99, image: "🐯", category: "ANIMAL" },
  { id: "avatar-fox", name: "여우 아바타", price: 2.99, image: "🦊", category: "ANIMAL" },
  { id: "avatar-mask", name: "미스터리 가면", price: 4.99, image: "🎭", category: "MASK" },
  { id: "avatar-robot", name: "로봇 아바타", price: 5.99, image: "🤖", category: "MASK" },
]

type CheckoutResponse = {
  url?: string
}

function ShopContent() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session === null) router.push("/login")
  }, [session, router])

  const handlePurchase = async (avatar: typeof avatars[0]) => {
    if (!session) {
      alert("로그인이 필요합니다")
      return
    }

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: avatar.name,
        price: avatar.price,
        itemType: "avatar",
        refName: avatar.name,
        avatarCategory: avatar.category,
        userId: session.user.id,
      }),
    })

    const data: CheckoutResponse = await res.json()

    if (data.url) {
      router.push(data.url)
    } else {
      alert("결제 준비 중 오류가 발생했습니다. 다시 시도해주세요.")
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080810",
      color: "#fff",
      padding: "40px 24px",
    }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
        아바타 상점
      </h1>
      <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 32 }}>
        마음에 드는 아바타를 선택하세요
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 16,
        maxWidth: 800,
      }}>
        {avatars.map((avatar) => (
          <div key={avatar.id} style={{
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.03)",
            padding: 24,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{avatar.image}</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{avatar.name}</div>
            <div style={{ color: "#22d3ee", fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
              ${avatar.price}
            </div>
            <button
              onClick={() => handlePurchase(avatar)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #a78bfa, #22d3ee)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              구매하기
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ShopPage() {
  return (
    <SessionProvider>
      <ShopContent />
    </SessionProvider>
  )
}
