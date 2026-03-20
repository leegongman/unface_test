import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const baseUrl = process.env.NEXTAUTH_URL ?? new URL(req.url).origin
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", baseUrl))
  }

  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })

  if (user?.gender && user?.countryCode) {
    return NextResponse.redirect(new URL("/main", baseUrl))
  }
  return NextResponse.redirect(new URL("/onboarding", baseUrl))
}
