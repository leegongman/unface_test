/* eslint-disable @next/next/no-page-custom-font */
"use client";

// 변경 이유: react-router-dom 의존성을 제거하고 Next.js App Router 경로를 직접 해석하도록 전환했습니다.
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminLayout } from "./components/AdminLayout";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AdminsPage } from "./pages/AdminsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ModerationPage } from "./pages/ModerationPage";
import { SessionsPage } from "./pages/SessionsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UsersPage } from "./pages/UsersPage";
import styles from "./AdminApp.module.css";

const routeComponentMap = {
  "/dashboard": DashboardPage,
  "/users": UsersPage,
  "/moderation": ModerationPage,
  "/sessions": SessionsPage,
  "/analytics": AnalyticsPage,
  "/settings": SettingsPage,
  "/admins": AdminsPage,
} as const;

type AdminRoutePath = keyof typeof routeComponentMap;

function getAdminPathname(pathname: string | null) {
  if (!pathname || !pathname.startsWith("/admin")) {
    return "/dashboard";
  }

  const strippedPath = pathname.replace(/^\/admin/, "") || "/";
  return strippedPath === "/" ? "/dashboard" : strippedPath;
}

function isAdminRoute(pathname: string): pathname is AdminRoutePath {
  return pathname in routeComponentMap;
}

export default function AdminApp() {
  const pathname = usePathname();
  const router = useRouter();
  const adminPathname = getAdminPathname(pathname);
  const isKnownRoute = isAdminRoute(adminPathname);

  useEffect(() => {
    if (!isKnownRoute) {
      router.replace("/admin/dashboard");
    }
  }, [isKnownRoute, router]);

  const fontLink = (
    <link
      href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Noto+Sans+KR:wght@400;500;700;900&display=swap"
      rel="stylesheet"
    />
  );

  if (!isKnownRoute) {
    return (
      <>
        {fontLink}
        <div className={styles.fallback}>관리자 콘솔을 준비하는 중...</div>
      </>
    );
  }

  const ActivePage = routeComponentMap[adminPathname];

  return (
    <>
      {fontLink}
      <AdminLayout pathname={adminPathname}>
        <ActivePage />
      </AdminLayout>
    </>
  );
}
