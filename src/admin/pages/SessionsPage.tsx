"use client";

import { useState } from "react";
import { GlassPanel } from "../components/GlassPanel";
import { StatusBadge } from "../components/StatusBadge";
import {
  activeSessions as sessionSeed,
  queueEntries as queueSeed,
} from "../mock/adminData";
import styles from "./AdminPage.module.css";

export function SessionsPage() {
  const [sessions, setSessions] = useState(sessionSeed);
  const [queueEntries, setQueueEntries] = useState(queueSeed);
  const [safeMode, setSafeMode] = useState(true);
  const [expandAfter, setExpandAfter] = useState(24);
  const [maxRegionDistance, setMaxRegionDistance] = useState(2);
  const [minBitrate, setMinBitrate] = useState(850);

  function forceEndSession(sessionId: string) {
    setSessions((current) =>
      current.filter((session) => session.sessionId !== sessionId)
    );
  }

  function flushOldestQueue() {
    setQueueEntries((current) => current.slice(1));
  }

  return (
    <div className={styles.page}>
      <div className={styles.doubleGrid}>
        <GlassPanel
          title="현재 진행 중인 통화"
          subtitle="익명화된 세션 ID 기준으로 모니터링"
          actions={
            <StatusBadge
              label={`${sessions.length} live`}
              tone="success"
            />
          }
        >
          <div className={styles.list}>
            {sessions.map((session) => (
              <div key={session.sessionId} className={styles.listItem}>
                <div className={styles.listItemColumn}>
                  <p className={styles.itemTitle}>{session.sessionId}</p>
                  <span className={styles.itemMeta}>
                    {session.regionPair} · {session.durationMinutes}분 진행 중 ·{" "}
                    {session.bitrateKbps}kbps
                  </span>
                </div>
                <div className={styles.buttonRow}>
                  <StatusBadge
                    label={session.state}
                    tone={session.state === "ESCALATED" ? "warning" : "success"}
                  />
                  <button
                    className={styles.dangerButton}
                    onClick={() => forceEndSession(session.sessionId)}
                  >
                    강제 종료
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel
          title="매칭 대기열"
          subtitle="지역, 언어, 우선도 기준 대기 현황"
          actions={
            <button className={styles.secondaryButton} onClick={flushOldestQueue}>
              오래된 큐 제거
            </button>
          }
        >
          <div className={styles.list}>
            {queueEntries.map((entry) => (
              <div key={entry.id} className={styles.listItem}>
                <div className={styles.listItemColumn}>
                  <p className={styles.itemTitle}>
                    {entry.region} / {entry.language}
                  </p>
                  <span className={styles.itemMeta}>
                    대기 {entry.waitedSeconds}초 · queue id {entry.id}
                  </span>
                </div>
                <StatusBadge
                  label={entry.priority}
                  tone={entry.priority === "SAFE_MODE" ? "warning" : "info"}
                />
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel
        title="매칭 알고리즘 파라미터"
        subtitle="운영 중 실험 가능한 범위의 설정만 노출"
      >
        <div className={styles.formGrid}>
          <div className={styles.detailCard}>
            <span className={styles.detailLabel}>
              지역 확장 시작 시간 ({expandAfter}초)
            </span>
            <input
              className={styles.input}
              type="range"
              min={5}
              max={60}
              value={expandAfter}
              onChange={(event) => setExpandAfter(Number(event.target.value))}
            />
          </div>

          <div className={styles.detailCard}>
            <span className={styles.detailLabel}>
              허용 지역 거리 단계 ({maxRegionDistance})
            </span>
            <input
              className={styles.input}
              type="range"
              min={1}
              max={4}
              value={maxRegionDistance}
              onChange={(event) =>
                setMaxRegionDistance(Number(event.target.value))
              }
            />
          </div>

          <div className={styles.detailCard}>
            <span className={styles.detailLabel}>
              최소 목표 비트레이트 ({minBitrate}kbps)
            </span>
            <input
              className={styles.input}
              type="range"
              min={400}
              max={1800}
              step={50}
              value={minBitrate}
              onChange={(event) => setMinBitrate(Number(event.target.value))}
            />
          </div>

          <div className={styles.toggleRow}>
            <div>
              <strong className={styles.strong}>세이프 모드</strong>
              <p className={styles.muted}>
                신고 누적 계정은 동일 언어/동일 지역 우선 매칭
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSafeMode((current) => !current)}
              className={[
                styles.toggleButton,
                safeMode ? styles.toggleButtonActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>
        </div>

        <div className={styles.callout} style={{ marginTop: 18 }}>
          <h3 className={styles.calloutTitle}>현재 적용 정책</h3>
          <p className={styles.calloutText}>
            대기 24초 이후부터 인접 리전으로 탐색을 확장하고, 목표 비트레이트
            850kbps 미만이면 카메라 해상도를 순차적으로 낮춥니다. 세이프 모드가
            활성화된 계정은 신고 위험도를 반영한 보수적 매칭을 우선합니다.
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}
