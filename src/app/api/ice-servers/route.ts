import { NextResponse } from "next/server"

function getTurnUrls() {
  const raw = process.env.TURN_URLS ?? process.env.TURN_URL ?? ""
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean)
    )
  )
}

export async function GET() {
  const iceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ]

  const turnUrls = getTurnUrls()
  const turnUsername = process.env.TURN_USERNAME?.trim()
  const turnCredential = process.env.TURN_CREDENTIAL?.trim()

  if (turnUrls.length > 0 && turnUsername && turnCredential) {
    iceServers.push({
      urls: turnUrls.length === 1 ? turnUrls[0] : turnUrls,
      username: turnUsername,
      credential: turnCredential,
    })
  } else if (turnUrls.length > 0 || turnUsername || turnCredential) {
    console.warn(
      "TURN is partially configured. Expected TURN_URL or TURN_URLS, TURN_USERNAME, and TURN_CREDENTIAL."
    )
  }

  return NextResponse.json({ iceServers })
}
