import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const calls = await prisma.call.findMany({
    where: {
      OR: [{ callerId: user.id }, { calleeId: user.id }],
    },
    orderBy: { startedAt: "desc" },
    take: 20,
  })

  const peerIds = Array.from(new Set(calls.map((c: any) => (c.callerId === user.id ? c.calleeId : c.callerId))))
  const peers = peerIds.length === 0
    ? []
    : await prisma.user.findMany({
        where: { id: { in: peerIds } },
        select: { id: true, nickname: true, countryCode: true },
      })
  const peerById: Record<string, { id: string; nickname: string | null; countryCode: string | null }> = {}
  for (const p of peers) { peerById[p.id] = p }

  const shaped = calls.map((c: any) => {
    const peerId = c.callerId === user.id ? c.calleeId : c.callerId
    return { ...c, peer: peerById[peerId] || null }
  })

  return NextResponse.json({ calls: shaped })
}
