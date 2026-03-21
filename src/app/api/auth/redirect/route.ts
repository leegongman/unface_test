// 변경 이유: 로그인 후 분기 라우트를 Auth.js v5 auth() 기반 세션 조회로 전환했습니다.
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  const session = await auth()
  const baseUrl = new URL(request.url).origin

  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", baseUrl))
  }

  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (user?.gender && user?.countryCode) {
    return NextResponse.redirect(new URL("/main", baseUrl))
  }

  return NextResponse.redirect(new URL("/onboarding", baseUrl))
}
