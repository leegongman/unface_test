import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createHmac } from "crypto"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  const userId = (session.user as any).id
  if (!userId) {
    return NextResponse.json({ error: "User id not found" }, { status: 400 })
  }

  const timestamp = Date.now().toString()
  const payload = `${userId}:${timestamp}`
  const sig = createHmac("sha256", secret).update(payload).digest("hex")

  return NextResponse.json({ token: `${userId}:${timestamp}:${sig}` })
}
