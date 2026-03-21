// 변경 이유: 친구 요청 목록 API를 Auth.js v5 auth() 기반 세션 조회로 전환했습니다.
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

  const received = await prisma.friendRequest.findMany({
    where: { receiverId: user.id, status: "PENDING" },
    include: {
      sender: { select: { id: true, nickname: true, countryCode: true, gender: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const sent = await prisma.friendRequest.findMany({
    where: { senderId: user.id, status: "PENDING" },
    include: {
      receiver: {
        select: { id: true, nickname: true, countryCode: true, gender: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ received, sent })
}
