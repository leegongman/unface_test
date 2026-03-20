import { NextResponse } from "next/server"

export async function POST() {
  // TODO: Replace this temporary block with a proper reset-token flow
  // that verifies ownership of the email address before allowing a password change.
  return NextResponse.json(
    {
      error: "Password reset is temporarily disabled",
      code: "PASSWORD_RESET_DISABLED",
    },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  )
}
