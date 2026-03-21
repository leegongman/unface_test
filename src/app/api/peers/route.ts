// 변경 이유: peers API를 Auth.js v5 auth() 기반 세션 조회 패턴으로 통일했습니다.
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

function randomNick() {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `익명#${num}`
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.create({
    data: {
      nickname: randomNick(),
    },
  })

  return NextResponse.json({ id: user.id, nickname: user.nickname })
}
