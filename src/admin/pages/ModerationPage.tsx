"use client";

import { useState } from "react";
import { GlassPanel } from "../components/GlassPanel";
import { StatusBadge } from "../components/StatusBadge";
import {
  ModerationReport,
  moderationReports as reportSeed,
} from "../mock/adminData";
import styles from "./AdminPage.module.css";

function reportTone(status: ModerationReport["status"]) {
  if (status === "RESOLVED") return "success";
  if (status === "REVIEWING") return "warning";
  return "info";
}

function verdictTone(verdict: ModerationReport["aiVerdict"]) {
  if (verdict === "VIOLATION") return "danger";
  if (verdict === "SUSPICIOUS") return "warning";
  return "success";
}

export function ModerationPage() {
  const [reports, setReports] = useState(reportSeed);
  const [reasonFilter, setReasonFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedReportId, setSelectedReportId] = useState(reportSeed[0]?.id ?? "");

  const filteredReports = reports.filter((report) => {
    const matchesReason =
      reasonFilter === "ALL" || report.reason === reasonFilter;
    const matchesStatus =
      statusFilter === "ALL" || report.status === statusFilter;
    return matchesReason && matchesStatus;
  });

  const selectedReport =
    filteredReports.find((report) => report.id === selectedReportId) ??
    filteredReports[0];

  function updateStatus(nextStatus: ModerationReport["status"]) {
    if (!selectedReport) return;

    setReports((current) =>
      current.map((report) =>
        report.id === selectedReport.id ? { ...report, status: nextStatus } : report
      )
    );
  }

  return (
    <div className={styles.page}>
      <GlassPanel
        title="신고 접수 목록"
        subtitle="사유별 분류, AI 자동 감지 결과, 처리 상태를 한 화면에서 검토"
      >
        <div className={styles.tableControls}>
          <select
            className={styles.select}
            value={reasonFilter}
            onChange={(event) => setReasonFilter(event.target.value)}
          >
            <option value="ALL">전체 사유</option>
            <option value="NUDITY">음란 / 노출</option>
            <option value="HARASSMENT">욕설 / 괴롭힘</option>
            <option value="SCAM">사기 / 외부 결제 유도</option>
            <option value="ABUSE">기타 악성 행위</option>
          </select>

          <select
            className={styles.select}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">전체 상태</option>
            <option value="RECEIVED">접수</option>
            <option value="REVIEWING">검토 중</option>
            <option value="RESOLVED">처리 완료</option>
          </select>
        </div>

        <div className={styles.doubleGrid} style={{ marginTop: 18 }}>
          <div className={styles.list}>
            {filteredReports.map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => setSelectedReportId(report.id)}
                className={[
                  styles.listItem,
                  selectedReport?.id === report.id ? styles.selectedRow : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  textAlign: "left",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  color: "inherit",
                }}
              >
                <div className={styles.listItemColumn}>
                  <p className={styles.itemTitle}>
                    {report.reportedUser} / {report.reason}
                  </p>
                  <span className={styles.itemMeta}>
                    {report.submittedAt} · 세션 {report.sessionId}
                  </span>
                  <div className={styles.badgeRow}>
                    <StatusBadge
                      label={report.status}
                      tone={reportTone(report.status)}
                    />
                    <StatusBadge
                      label={`AI ${report.aiVerdict}`}
                      tone={verdictTone(report.aiVerdict)}
                    />
                    {report.repeatCount >= 3 ? (
                      <StatusBadge label="반복 신고 유저" tone="danger" />
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <GlassPanel
            title={selectedReport ? `${selectedReport.id} 상세` : "신고 없음"}
            subtitle="세션 로그와 AI 자동 판정 근거"
          >
            {selectedReport ? (
              <div className={styles.stack}>
                <div className={styles.detailGrid}>
                  <div className={styles.detailCard}>
                    <span className={styles.detailLabel}>신고 대상</span>
                    <strong className={styles.detailValue}>
                      {selectedReport.reportedUser}
                    </strong>
                  </div>
                  <div className={styles.detailCard}>
                    <span className={styles.detailLabel}>AI confidence</span>
                    <strong className={styles.detailValue}>
                      {(selectedReport.aiConfidence * 100).toFixed(0)}%
                    </strong>
                  </div>
                </div>

                <div className={styles.callout}>
                  <h3 className={styles.calloutTitle}>요약</h3>
                  <p className={styles.calloutText}>{selectedReport.summary}</p>
                </div>

                <div>
                  <div className={styles.splitRow}>
                    <strong className={styles.strong}>세션 로그</strong>
                    <StatusBadge
                      label={`${selectedReport.repeatCount}회 누적 신고`}
                      tone={selectedReport.repeatCount >= 3 ? "danger" : "warning"}
                    />
                  </div>
                  <div className={styles.list} style={{ marginTop: 12 }}>
                    {selectedReport.callLog.map((entry) => (
                      <div key={entry} className={styles.listItem}>
                        <div className={styles.listItemColumn}>
                          <p className={styles.itemTitle}>{entry}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.badgeRow}>
                  {selectedReport.tags.map((tag) => (
                    <StatusBadge
                      key={tag}
                      label={`#${tag}`}
                      tone={tag.includes("repeat") ? "danger" : "info"}
                    />
                  ))}
                </div>

                <div className={styles.buttonRow}>
                  <button
                    className={styles.warningButton}
                    onClick={() => updateStatus("REVIEWING")}
                  >
                    검토 시작
                  </button>
                  <button
                    className={styles.primaryButton}
                    onClick={() => updateStatus("RESOLVED")}
                  >
                    처리 완료
                  </button>
                  <button
                    className={styles.ghostButton}
                    onClick={() => updateStatus("RECEIVED")}
                  >
                    접수 상태로 되돌리기
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>표시할 신고가 없습니다.</div>
            )}
          </GlassPanel>
        </div>
      </GlassPanel>
    </div>
  );
}
