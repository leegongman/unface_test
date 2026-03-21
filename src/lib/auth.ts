// 변경 이유: NextAuth v4 설정을 Auth.js v5 패턴으로 마이그레이션하고 JWT 세션 필드를 타입 안전하게 유지하기 위해 재작성했습니다.
import type { Role, User, UserStatus } from "@prisma/client"
import bcrypt from "bcryptjs"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"

type AuthUserShape = {
  id: string
  email: string
  name: string
  nickname: string
  role: Role
  onboardingDone: boolean
}

function getDisplayNickname(user: Pick<User, "nickname">) {
  return user.nickname?.trim() || "익명"
}

function getOnboardingDone(user: Pick<User, "gender" | "countryCode">) {
  // 스키마에 onboardingDone 필드가 없어 기존 온보딩 완료 판별 로직을 그대로 사용합니다.
  return Boolean(user.gender && user.countryCode)
}

function isBlockedStatus(status: UserStatus) {
  return status === "SUSPENDED" || status === "DELETED"
}

function toAuthUser(user: Pick<User, "id" | "email" | "nickname" | "role" | "gender" | "countryCode">): AuthUserShape {
  return {
    id: user.id,
    email: user.email ?? "",
    name: getDisplayNickname(user),
    nickname: getDisplayNickname(user),
    role: user.role,
    onboardingDone: getOnboardingDone(user),
  }
}

async function findUserByEmail(email: string) {
  const { prisma } = await import("./prisma")

  return prisma.user.findUnique({
    where: { email },
  })
}

async function upsertGoogleSocialAccount(params: {
  userId: string
  providerUid: string
  accessToken: string | null
  refreshToken: string | null
}) {
  const { prisma } = await import("./prisma")

  await prisma.socialAccount.upsert({
    where: {
      provider_providerUid: {
        provider: "GOOGLE",
        providerUid: params.providerUid,
      },
    },
    update: {
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
    },
    create: {
      userId: params.userId,
      provider: "GOOGLE",
      providerUid: params.providerUid,
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
    },
  })
}

export const authOptions = {
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      id: "credentials",
      name: "이메일 로그인",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email.trim() : ""
        const password =
          typeof credentials?.password === "string" ? credentials.password : ""

        if (!email || !password) {
          throw new Error("이메일과 비밀번호를 입력해주세요")
        }

        const user = await findUserByEmail(email)
        if (!user || !user.password) {
          throw new Error("등록되지 않은 이메일입니다")
        }

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
          throw new Error("비밀번호가 일치하지 않습니다")
        }

        return toAuthUser(user)
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      const email = user.email?.trim()
      if (!email) return false

      let dbUser = await findUserByEmail(email)

      if (account?.provider === "google") {
        const { prisma } = await import("./prisma")

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email,
              nickname: user.name?.trim() || "익명",
            },
          })
        }

        await upsertGoogleSocialAccount({
          userId: dbUser.id,
          providerUid: account.providerAccountId,
          accessToken: account.access_token ?? null,
          refreshToken: account.refresh_token ?? null,
        })
      }

      if (!dbUser) return false
      if (isBlockedStatus(dbUser.status)) return false

      const normalizedUser = toAuthUser(dbUser)
      user.id = normalizedUser.id
      user.email = normalizedUser.email
      user.name = normalizedUser.name
      user.nickname = normalizedUser.nickname
      user.role = normalizedUser.role
      user.onboardingDone = normalizedUser.onboardingDone

      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.nickname = user.nickname
        token.onboardingDone = user.onboardingDone
        token.name = user.name
        token.email = user.email
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : ""
        session.user.role = (token.role as Role | undefined) ?? "USER"
        session.user.nickname =
          typeof token.nickname === "string"
            ? token.nickname
            : session.user.name ?? "익명"
        session.user.onboardingDone = Boolean(token.onboardingDone)
        session.user.name = session.user.nickname
        session.user.email =
          typeof token.email === "string" ? token.email : session.user.email
      }

      return session
    },
  },
} satisfies Parameters<typeof NextAuth>[0]

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)
