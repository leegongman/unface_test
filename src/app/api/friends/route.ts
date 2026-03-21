// 변경 이유: 친구 요청/목록 API를 Auth.js v5 auth() 기반 세션 조회로 전환했습니다.
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { receiverId, autoAccept } = await req.json()
  const { prisma } = await import("@/lib/prisma")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const existing = await prisma.friendRequest.findUnique({
    where: { senderId_receiverId: { senderId: user.id, receiverId } },
  })

  if (existing) {
    return NextResponse.json({ error: "이미 친구 요청을 보냈습니다" }, { status: 409 })
  }

  const request = await prisma.friendRequest.create({
    data: {
      senderId: user.id,
      receiverId,
      status: autoAccept ? "ACCEPTED" : "PENDING",
      respondedAt: autoAccept ? new Date() : null,
    },
  })

  return NextResponse.json({ requestId: request.id })
}

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

  const friends = await prisma.friendRequest.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ senderId: user.id }, { receiverId: user.id }],
    },
    include: {
      sender: { select: { id: true, nickname: true, countryCode: true, gender: true } },
      receiver: {
        select: { id: true, nickname: true, countryCode: true, gender: true },
      },
    },
  })

  const friendList = friends.map(
    (friendRequest: (typeof friends)[number]) =>
      friendRequest.senderId === user.id
        ? friendRequest.receiver
        : friendRequest.sender
  )

  return NextResponse.json({ friends: friendList })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { senderId, accepted } = await req.json()
  const { prisma } = await import("@/lib/prisma")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const updated = await prisma.friendRequest.updateMany({
    where: { senderId, receiverId: user.id, status: "PENDING" },
    data: {
      status: accepted ? "ACCEPTED" : "REJECTED",
      respondedAt: new Date(),
    },
  })

  if (updated.count === 0) {
    return NextResponse.json({ error: "요청을 찾을 수 없습니다" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
