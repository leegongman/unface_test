"use client";

// 변경 이유: react-router-dom Link/NavLink를 Next.js Link로 교체하고 현재 경로 기반 active 상태를 직접 계산하도록 변경했습니다.
import Link from "next/link";
import { adminRoutes } from "../config";
import styles from "./Sidebar.module.css";

type SidebarProps = {
  pathname: string;
};

export function Sidebar({ pathname }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brandBlock}>
        <Link href="/admin/dashboard" className={styles.logo}>
          unface
        </Link>
        <h1 className={styles.brand}>운영 콘솔</h1>
        <p className={styles.description}>
          실시간 세션, 사용자 제재, 신고 처리, 시스템 설정을 한 번에 관리합니다.
        </p>
      </div>

      <nav className={styles.nav}>
        {adminRoutes.map((route) => {
          const isActive =
            pathname === route.path || pathname.startsWith(`${route.path}/`);

          return (
            <Link
              key={route.path}
              href={`/admin${route.path}`}
              className={[styles.link, isActive ? styles.active : ""]
                .filter(Boolean)
                .join(" ")}
            >
              <span className={styles.linkContent}>
                <span className={styles.linkLabel}>{route.label}</span>
                <span className={styles.linkDescription}>
                  {route.shortLabel}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footerCard}>
        <span className={styles.footerTitle}>운영 모드</span>
        <strong className={styles.footerValue}>목업 데이터 미리보기</strong>
        <p className={styles.footerText}>
          관리자 UX와 정보 구조를 먼저 검증할 수 있도록 모든 데이터는 더미 상태로 구성했습니다.
        </p>
      </div>
    </aside>
  );
}
