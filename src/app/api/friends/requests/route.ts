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

  // 받은 요청 (PENDING)
  const received = await prisma.friendRequest.findMany({
    where: { receiverId: user.id, status: "PENDING" },
    include: {
      sender: { select: { id: true, nickname: true, countryCode: true, gender: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  // 보낸 요청 (PENDING)
  const sent = await prisma.friendRequest.findMany({
    where: { senderId: user.id, status: "PENDING" },
    include: {
      receiver: { select: { id: true, nickname: true, countryCode: true, gender: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ received, sent })
}
