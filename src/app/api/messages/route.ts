import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

function fmtTime(date: Date): string {
  const hour = date.getHours()
  const min = String(date.getMinutes()).padStart(2, "0")
  return hour >= 12 ? `오후 ${hour - 12 || 12}:${min}` : `오전 ${hour}:${min}`
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const friendId = url.searchParams.get("friendId")
  if (!friendId) return NextResponse.json({ error: "friendId required" }, { status: 400 })

  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: friendId },
        { senderId: friendId, receiverId: user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  })

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      mine: m.senderId === user.id,
      text: m.content,
      time: fmtTime(m.createdAt),
    })),
  })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { receiverId, content } = await req.json()
  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const message = await prisma.directMessage.create({
    data: { senderId: user.id, receiverId, content },
  })

  return NextResponse.json({ id: message.id })
}
