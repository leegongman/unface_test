// 변경 이유: App Router 인증 라우트를 Auth.js v5 handlers 패턴으로 전환했습니다.
import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
