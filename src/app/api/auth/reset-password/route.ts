import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  const { email, password } = await req.json()

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.update({ where: { email }, data: { password: hashed } })

  return NextResponse.json({ ok: true })
}
