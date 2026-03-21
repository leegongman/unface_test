// 변경 이유: 최근 통화 조회 API를 Auth.js v5 auth() 기반 세션 조회로 전환했습니다.
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

  const calls = await prisma.call.findMany({
    where: {
      OR: [{ callerId: user.id }, { calleeId: user.id }],
    },
    orderBy: { startedAt: "desc" },
    take: 20,
  })

  const peerIds = Array.from(
    new Set(
      calls.map(
        (call: (typeof calls)[number]) =>
          call.callerId === user.id ? call.calleeId : call.callerId
      )
    )
  )

  const peers =
    peerIds.length === 0
      ? []
      : await prisma.user.findMany({
          where: { id: { in: peerIds } },
          select: { id: true, nickname: true, countryCode: true },
        })

  const peerById: Record<
    string,
    { id: string; nickname: string | null; countryCode: string | null }
  > = {}

  for (const peer of peers) {
    peerById[peer.id] = peer
  }

  const shaped = calls.map((call: (typeof calls)[number]) => {
    const peerId = call.callerId === user.id ? call.calleeId : call.callerId
    return { ...call, peer: peerById[peerId] ?? null }
  })

  return NextResponse.json({ calls: shaped })
}
