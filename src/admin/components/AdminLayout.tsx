"use client";

// 변경 이유: react-router-dom useLocation 대신 Next.js 경로 문자열을 props로 받아 메타 정보를 계산하도록 변경했습니다.
import { getRouteMeta } from "../config";
import { Sidebar } from "./Sidebar";
import styles from "./AdminLayout.module.css";

type AdminLayoutProps = {
  children: React.ReactNode;
  pathname: string;
};

export function AdminLayout({ children, pathname }: AdminLayoutProps) {
  const routeMeta = getRouteMeta(pathname);

  return (
    <div className={styles.app}>
      <div className={styles.frame}>
        <Sidebar pathname={pathname} />

        <div className={styles.mainPane}>
          <header className={styles.header}>
            <div>
              <span className={styles.kicker}>{routeMeta.shortLabel}</span>
              <h2 className={styles.title}>{routeMeta.label}</h2>
              <p className={styles.description}>{routeMeta.description}</p>
            </div>

            <div className={styles.headerActions}>
              <div className={styles.pill}>
                <span className={styles.dot} />
                실시간 운영 중
              </div>
              <button className={styles.secondaryButton}>스냅샷 저장</button>
              <button className={styles.primaryButton}>운영팀 공지</button>
            </div>
          </header>

          <main className={styles.content}>{children}</main>
        </div>
      </div>
    </div>
  );
}
