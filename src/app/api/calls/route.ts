import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { peerId, durationSec } = await req.json()
  if (!peerId) {
    return NextResponse.json({ error: "peerId is required" }, { status: 400 })
  }

  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const match = await prisma.match.create({
    data: { userAId: user.id, userBId: peerId },
  })

  const duration = typeof durationSec === "number" ? durationSec : 0
  const endedAt = new Date()
  const startedAt = new Date(endedAt.getTime() - duration * 1000)

  const call = await prisma.call.create({
    data: {
      matchId: match.id,
      callerId: user.id,
      calleeId: peerId,
      startedAt,
      endedAt,
      durationSec: duration,
    },
  })

  return NextResponse.json({ id: call.id })
}
