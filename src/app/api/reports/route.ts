import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { targetId, callId, reason, description } = await req.json()
  const { prisma } = await import("@/lib/prisma")

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const report = await prisma.report.create({
    data: {
      reporterId: user.id,
      targetId,
      callId: callId || null,
      reason,
      description: description || null,
      status: "PENDING",
    },
  })

  return NextResponse.json({ reportId: report.id, message: "신고가 접수되었습니다" })
}
