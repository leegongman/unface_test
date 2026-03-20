import { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      id: "credentials",
      name: "이메일 로그인",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("이메일과 비밀번호를 입력해주세요")
        }

        const { prisma } = await import("./prisma")

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          throw new Error("등록되지 않은 이메일입니다")
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          throw new Error("비밀번호가 일치하지 않습니다")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email || !account) return false

        const { prisma } = await import("./prisma")

        let dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        })

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              nickname: user.name || "익명",
            },
          })
        }

        await prisma.socialAccount.upsert({
          where: {
            provider_providerUid: {
              provider: "GOOGLE",
              providerUid: account.providerAccountId,
            },
          },
          update: {
            accessToken: account.access_token ?? null,
            refreshToken: account.refresh_token ?? null,
          },
          create: {
            userId: dbUser.id,
            provider: "GOOGLE",
            providerUid: account.providerAccountId,
            accessToken: account.access_token ?? null,
            refreshToken: account.refresh_token ?? null,
          },
        })
      }

      return true
    },

    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google") {
          // Google 로그인: user.id는 Google 계정 ID → DB UUID로 교체
          const { prisma } = await import("./prisma")
          const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
          token.id = dbUser?.id ?? user.id
        } else {
          // Credentials 로그인: authorize()가 이미 DB UUID 반환
          token.id = user.id
        }
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
      }
      return session
    },
  },

  pages: {
    signIn: "/login",
  },
}
