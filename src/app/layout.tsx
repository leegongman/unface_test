// 변경 이유: 빌드 시 외부 Google Font 네트워크 의존성을 제거해 Auth.js 마이그레이션 검증이 안정적으로 완료되도록 조정했습니다.
import type { Metadata } from "next"

import "./globals.css"
import Providers from "./providers"

export const metadata: Metadata = {
  title: "unface",
  description: "익명 랜덤 영상통화 서비스 unface",
  applicationName: "unface",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className="app-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
