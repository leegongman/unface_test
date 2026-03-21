// 변경 이유: 크레딧 조회 API를 Auth.js v5 auth() 기반 세션 조회로 전환했습니다.
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const history = await prisma.creditTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ balance: user.creditBalance, history })
}
