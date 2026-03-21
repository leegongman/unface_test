// 변경 이유: 친구 요청 수락 API를 Auth.js v5 auth() 기반 세션 조회로 전환했습니다.
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { requestId } = await req.json()
  const { prisma } = await import("@/lib/prisma")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  })

  if (!request || request.receiverId !== user.id) {
    return NextResponse.json({ error: "요청을 찾을 수 없습니다" }, { status: 404 })
  }

  await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: "ACCEPTED", respondedAt: new Date() },
  })

  return NextResponse.json({ message: "친구 요청을 수락했습니다" })
}
