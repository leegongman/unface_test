export type AdminRoute = {
  path: string;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
};

export const adminRoutes: AdminRoute[] = [
  {
    path: "/dashboard",
    label: "대시보드",
    shortLabel: "Dashboard",
    icon: "◉",
    description: "실시간 접속, 통화, 시스템 부하를 한눈에 보는 메인 화면",
  },
  {
    path: "/users",
    label: "사용자 관리",
    shortLabel: "Users",
    icon: "◎",
    description: "회원 검색, 제재, 상세 이력 확인",
  },
  {
    path: "/moderation",
    label: "신고 / 모더레이션",
    shortLabel: "Moderation",
    icon: "△",
    description: "신고 접수와 AI 감지 결과를 검토하는 운영 화면",
  },
  {
    path: "/sessions",
    label: "세션 관리",
    shortLabel: "Sessions",
    icon: "◇",
    description: "실시간 통화 세션과 매칭 큐를 제어",
  },
  {
    path: "/analytics",
    label: "통계 / 분석",
    shortLabel: "Analytics",
    icon: "▣",
    description: "트래픽, 매칭 성공률, 이탈 지표를 분석",
  },
  {
    path: "/settings",
    label: "시스템 설정",
    shortLabel: "Settings",
    icon: "✦",
    description: "점검 모드, 금지어, 공지사항 같은 운영 정책 관리",
  },
  {
    path: "/admins",
    label: "관리자 계정",
    shortLabel: "Admins",
    icon: "⬢",
    description: "관리자 권한과 활동 로그, 2FA 상태를 관리",
  },
];

export function getRouteMeta(pathname: string) {
  const normalizedPath = pathname === "/" ? "/dashboard" : pathname;
  return (
    adminRoutes.find(
      (route) =>
        normalizedPath === route.path ||
        normalizedPath.startsWith(`${route.path}/`)
    ) ?? adminRoutes[0]
  );
}
