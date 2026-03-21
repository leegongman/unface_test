// 변경 이유: 보호된 사용자 정보 API를 Auth.js v5 auth() 기반 세션 조회로 전환했습니다.
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
    include: {
      userAvatars: { include: { avatar: true } },
      subscriptions: { where: { status: "ACTIVE" }, include: { plan: true } },
    },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const equippedAvatar =
    user.userAvatars.find(
      (userAvatar: (typeof user.userAvatars)[number]) => userAvatar.isEquipped
    )?.avatar ?? null

  return NextResponse.json({
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    gender: user.gender,
    countryCode: user.countryCode,
    language: user.language,
    bio: user.bio,
    interests: user.interests,
    creditBalance: user.creditBalance,
    userAvatars: user.userAvatars,
    equippedAvatar,
    subscription: user.subscriptions[0]?.plan ?? null,
  })
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { prisma } = await import("@/lib/prisma")

  const updateData: Record<string, unknown> = {}
  if (body.gender !== undefined) updateData.gender = body.gender
  if (body.countryCode !== undefined) updateData.countryCode = body.countryCode
  if (body.language !== undefined) updateData.language = body.language
  if (body.nickname !== undefined) updateData.nickname = body.nickname
  if (body.bio !== undefined) updateData.bio = body.bio
  if (body.interests !== undefined) updateData.interests = body.interests

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: updateData,
  })

  return NextResponse.json({ user })
}
