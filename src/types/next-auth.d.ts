// 변경 이유: Auth.js v5 세션/JWT에 user.id, role, nickname, onboardingDone를 타입 안전하게 포함하기 위해 모듈 보강을 추가했습니다.
import type { Role } from "@prisma/client"
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string
      role: Role
      nickname: string
      onboardingDone: boolean
    }
  }

  interface User {
    id: string
    role: Role
    nickname: string
    onboardingDone: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: Role
    nickname?: string
    onboardingDone?: boolean
  }
}
