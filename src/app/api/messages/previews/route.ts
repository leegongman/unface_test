import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // 수락된 친구 목록
  const friendships = await prisma.friendRequest.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ senderId: user.id }, { receiverId: user.id }],
    },
    select: { senderId: true, receiverId: true },
  })

  const friendIds = friendships.map((f) =>
    f.senderId === user.id ? f.receiverId : f.senderId
  )

  if (friendIds.length === 0) return NextResponse.json({ previews: {} })

  // 각 친구별 마지막 메시지 + 안읽음 수 병렬 조회
  const results = await Promise.all(
    friendIds.map(async (friendId) => {
      const [lastMsg, unreadCount] = await Promise.all([
        prisma.directMessage.findFirst({
          where: {
            OR: [
              { senderId: user.id, receiverId: friendId },
              { senderId: friendId, receiverId: user.id },
            ],
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.directMessage.count({
          where: { senderId: friendId, receiverId: user.id, read: false },
        }),
      ])

      return {
        friendId,
        lastMessage: lastMsg?.content ?? "",
        lastTime: lastMsg?.createdAt.toISOString() ?? "",
        unreadCount,
      }
    })
  )

  const previews: Record<string, { lastMessage: string; lastTime: string; unreadCount: number }> = {}
  for (const r of results) {
    previews[r.friendId] = {
      lastMessage: r.lastMessage,
      lastTime: r.lastTime,
      unreadCount: r.unreadCount,
    }
  }

  return NextResponse.json({ previews })
}
