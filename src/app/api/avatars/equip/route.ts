// 변경 이유: 아바타 장착 API를 Auth.js v5 auth() 기반 세션 조회로 전환했습니다.
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { avatarId } = await req.json()
  const { prisma } = await import("@/lib/prisma")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  await prisma.userAvatar.updateMany({
    where: { userId: user.id, isEquipped: true },
    data: { isEquipped: false },
  })

  await prisma.userAvatar.update({
    where: { userId_avatarId: { userId: user.id, avatarId } },
    data: { isEquipped: true },
  })

  return NextResponse.json({ success: true })
}
