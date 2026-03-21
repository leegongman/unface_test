// 변경 이유: Next.js 16에서 middleware 파일명이 proxy로 변경되어 동일한 보호 경로 로직을 새 파일명으로 유지합니다.
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

export default auth((request) => {
  if (request.auth) {
    return NextResponse.next()
  }

  const loginUrl = new URL("/login", request.nextUrl.origin)
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.href)

  return NextResponse.redirect(loginUrl)
})

export const config = {
  matcher: ["/main/:path*", "/shop/:path*", "/onboarding/:path*"],
}
