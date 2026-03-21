"use client";

import { useState } from "react";
import { GlassPanel } from "../components/GlassPanel";
import { StatusBadge } from "../components/StatusBadge";
import {
  AdminAccount,
  adminAccounts as adminSeed,
  auditLogs,
} from "../mock/adminData";
import styles from "./AdminPage.module.css";

const roleOrder: AdminAccount["role"][] = [
  "MODERATOR",
  "ADMIN",
  "SUPER_ADMIN",
];

function nextRole(role: AdminAccount["role"]) {
  const index = roleOrder.indexOf(role);
  return roleOrder[(index + 1) % roleOrder.length];
}

export function AdminsPage() {
  const [admins, setAdmins] = useState(adminSeed);
  const [selectedAdminId, setSelectedAdminId] = useState(adminSeed[0]?.id ?? "");

  const selectedAdmin =
    admins.find((admin) => admin.id === selectedAdminId) ?? admins[0];

  function rotateRole() {
    if (!selectedAdmin) return;
    setAdmins((current) =>
      current.map((admin) =>
        admin.id === selectedAdmin.id
          ? { ...admin, role: nextRole(admin.role) }
          : admin
      )
    );
  }

  function toggleTwoFactor() {
    if (!selectedAdmin) return;
    setAdmins((current) =>
      current.map((admin) =>
        admin.id === selectedAdmin.id
          ? { ...admin, twoFactorEnabled: !admin.twoFactorEnabled }
          : admin
      )
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.doubleGrid}>
        <GlassPanel
          title="관리자 계정"
          subtitle="슈퍼 어드민 / 일반 어드민 / 모더레이터 권한 구성"
        >
          <div className={styles.list}>
            {admins.map((admin) => (
              <button
                key={admin.id}
                type="button"
                onClick={() => setSelectedAdminId(admin.id)}
                className={[
                  styles.listItem,
                  selectedAdmin?.id === admin.id ? styles.selectedRow : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ textAlign: "left", color: "inherit" }}
              >
                <div className={styles.listItemColumn}>
                  <p className={styles.itemTitle}>{admin.name}</p>
                  <span className={styles.itemMeta}>
                    {admin.email} · 최근 활동 {admin.lastActive}
                  </span>
                </div>
                <div className={styles.badgeRow}>
                  <StatusBadge
                    label={admin.role}
                    tone={admin.role === "SUPER_ADMIN" ? "danger" : "info"}
                  />
                  <StatusBadge
                    label={admin.twoFactorEnabled ? "2FA ON" : "2FA OFF"}
                    tone={admin.twoFactorEnabled ? "success" : "warning"}
                  />
                </div>
              </button>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel
          title={selectedAdmin ? `${selectedAdmin.name} 계정 설정` : "선택된 계정 없음"}
          subtitle="권한 레벨과 2FA를 관리"
        >
          {selectedAdmin ? (
            <div className={styles.stack}>
              <div className={styles.detailGrid}>
                <div className={styles.detailCard}>
                  <span className={styles.detailLabel}>현재 권한</span>
                  <strong className={styles.detailValue}>
                    {selectedAdmin.role}
                  </strong>
                </div>
                <div className={styles.detailCard}>
                  <span className={styles.detailLabel}>처리한 인시던트</span>
                  <strong className={styles.detailValue}>
                    {selectedAdmin.incidentsHandled}건
                  </strong>
                </div>
              </div>

              <div className={styles.buttonRow}>
                <button className={styles.warningButton} onClick={rotateRole}>
                  권한 순환 변경
                </button>
                <button className={styles.secondaryButton} onClick={toggleTwoFactor}>
                  {selectedAdmin.twoFactorEnabled ? "2FA 해제" : "2FA 활성화"}
                </button>
              </div>

              <div className={styles.callout}>
                <h3 className={styles.calloutTitle}>권한 정책</h3>
                <p className={styles.calloutText}>
                  슈퍼 어드민은 시스템 설정과 관리자 계정 변경 권한을 모두 가지며,
                  일반 어드민은 제재와 공지 관리, 모더레이터는 신고 검토와 세션
                  종료만 허용됩니다.
                </p>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>선택된 관리자가 없습니다.</div>
          )}
        </GlassPanel>
      </div>

      <GlassPanel
        title="관리자 활동 로그"
        subtitle="audit log 기반 운영 이력"
      >
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>시간</th>
                <th>관리자</th>
                <th>액션</th>
                <th>대상</th>
                <th>심각도</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.createdAt}</td>
                  <td>{log.actor}</td>
                  <td>{log.action}</td>
                  <td>{log.target}</td>
                  <td>
                    <StatusBadge
                      label={log.severity}
                      tone={log.severity === "HIGH" ? "danger" : log.severity === "MEDIUM" ? "warning" : "info"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </div>
  );
}
