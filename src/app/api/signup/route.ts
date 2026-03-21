import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { email, password, nickname } = await req.json()

    if (!email || !password || !nickname) {
      return NextResponse.json({ error: "이메일, 비밀번호, 닉네임을 모두 입력해주세요" }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다" }, { status: 400 })
    }

    const { prisma } = await import("@/lib/prisma")

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "이미 가입된 이메일입니다" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, nickname },
    })

    return NextResponse.json({ message: "회원가입 성공!", userId: user.id })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}
