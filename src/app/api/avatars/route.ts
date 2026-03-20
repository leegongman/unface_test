import { NextResponse } from "next/server"

export async function GET() {
  const { prisma } = await import("@/lib/prisma")

  const existing = await prisma.avatar.count()
  if (existing === 0) {
    await prisma.avatar.createMany({
      data: [
        { name: "기본", category: "MASK", priceCredits: 1, isPremium: false },
        { name: "고양이", category: "ANIMAL", priceCredits: 1, isPremium: false },
        { name: "여우", category: "ANIMAL", priceCredits: 1, isPremium: false },
        { name: "로봇", category: "MASK", priceCredits: 1, isPremium: false },
        { name: "문어", category: "ANIMAL", priceCredits: 1, isPremium: false },
        { name: "사자", category: "ANIMAL", priceCredits: 1, isPremium: false },
        { name: "에일리언", category: "MASK", priceCredits: 1, isPremium: false },
        { name: "호박", category: "MASK", priceCredits: 1, isPremium: false },
        { name: "곰인형", category: "ANIMAL", priceCredits: 1, isPremium: false },
        { name: "장원영", category: "HUMAN", priceCredits: 1, isPremium: true },
        { name: "뷔", category: "HUMAN", priceCredits: 1, isPremium: true },
        { name: "카리나", category: "HUMAN", priceCredits: 1, isPremium: true },
        { name: "차은우", category: "HUMAN", priceCredits: 1, isPremium: true },
        { name: "윈터", category: "HUMAN", priceCredits: 1, isPremium: true },
        { name: "지민", category: "HUMAN", priceCredits: 1, isPremium: true },
      ],
      skipDuplicates: true,
    })
  }

  const avatars = await prisma.avatar.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { priceCredits: "asc" }],
  })

  return NextResponse.json({ avatars })
}
