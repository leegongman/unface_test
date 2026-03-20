import { NextResponse } from "next/server"

function randomNick() {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `익명#${num}`
}

export async function POST() {
  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.create({
    data: {
      nickname: randomNick(),
    },
  })
  return NextResponse.json({ id: user.id, nickname: user.nickname })
}
