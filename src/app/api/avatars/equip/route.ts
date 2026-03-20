import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { avatarId } = await req.json()
  const { prisma } = await import("@/lib/prisma")

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

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
