import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { friendId } = await req.json()
  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  await prisma.directMessage.updateMany({
    where: { senderId: friendId, receiverId: user.id, read: false },
    data: { read: true },
  })

  return NextResponse.json({ ok: true })
}
