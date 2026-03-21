// 변경 이유: 소켓 토큰 발급 API를 Auth.js v5 auth() 기반 세션 조회로 전환했습니다.
import { createHmac } from "crypto"

import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  if (!session.user.id) {
    return NextResponse.json({ error: "User id not found" }, { status: 400 })
  }

  const timestamp = Date.now().toString()
  const payload = `${session.user.id}:${timestamp}`
  const sig = createHmac("sha256", secret).update(payload).digest("hex")

  return NextResponse.json({ token: `${session.user.id}:${timestamp}:${sig}` })
}
