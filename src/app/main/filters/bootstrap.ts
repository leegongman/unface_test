// 파일 경로: src/app/main/filters/bootstrap.ts

// 현재 구현된 필터를 명시적으로 불러와 self-register를 확실하게 실행합니다.
// Next.js App Router 환경에서는 require.context 기반 동적 등록이 흔들릴 수 있어
// 실제 런타임에서 registry가 비어 있는 문제가 생길 수 있습니다.
import "./avatars/CatFilter"
