// 변경 이유: 중첩 작업 폴더(`unface_`)를 독립 빌드 대상으로 사용할 때 output tracing 경고를 줄이기 위해 루트를 명시합니다.
import path from "path"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
}

export default nextConfig
