"use client";

import { useEffect, useState } from "react";
import { GlassPanel } from "../components/GlassPanel";
import { SparklineChart } from "../components/SparklineChart";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import {
  dashboardSnapshot,
  trafficPoints,
} from "../mock/adminData";
import styles from "./AdminPage.module.css";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function DashboardPage() {
  const [liveMetrics, setLiveMetrics] = useState(dashboardSnapshot);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLiveMetrics((current) => ({
        ...current,
        onlineUsers: clamp(
          current.onlineUsers + Math.round((Math.random() - 0.5) * 28),
          1180,
          1360
        ),
        activeCalls: clamp(
          current.activeCalls + Math.round((Math.random() - 0.5) * 12),
          280,
          340
        ),
        cpuLoad: clamp(
          current.cpuLoad + Math.round((Math.random() - 0.5) * 6),
          28,
          67
        ),
        memoryLoad: clamp(
          current.memoryLoad + Math.round((Math.random() - 0.5) * 4),
          46,
          74
        ),
        webrtcLoad: clamp(
          current.webrtcLoad + Math.round((Math.random() - 0.5) * 5),
          42,
          79
        ),
      }));
    }, 2400);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.statsGrid}>
        <StatCard
          label="현재 접속자"
          value={liveMetrics.onlineUsers.toLocaleString("ko-KR")}
          description="최근 5분 평균 대비 +6.2%"
          trend="+6.2%"
          accent="mint"
        />
        <StatCard
          label="활성 통화"
          value={liveMetrics.activeCalls.toLocaleString("ko-KR")}
          description="매칭 성사 후 90초 이내 연결 완료 세션"
          trend="+3.1%"
          accent="purple"
        />
        <StatCard
          label="오늘 신규 가입"
          value={liveMetrics.todaySignups.toString()}
          description={`누적 ${liveMetrics.totalUsers.toLocaleString("ko-KR")}명`}
          trend="+14%"
          accent="amber"
        />
        <StatCard
          label="오늘 매칭"
          value={liveMetrics.todayMatches.toLocaleString("ko-KR")}
          description={`평균 통화 ${liveMetrics.averageCallMinutes.toFixed(1)}분`}
          trend="+8.4%"
          accent="rose"
        />
      </div>

      <div className={styles.doubleGrid}>
        <GlassPanel
          title="운영 상황 요약"
          subtitle="실시간 운영자가 가장 먼저 봐야 하는 핵심 지표"
        >
          <div className={styles.callout}>
            <h3 className={styles.calloutTitle}>
              오늘 피크 트래픽은 21시대로 예상됩니다.
            </h3>
            <p className={styles.calloutText}>
              매칭 성공률은 78%로 안정권이지만, 브라질 ↔ 미국 큐에서 평균
              대기 시간이 28초까지 올라가고 있습니다. TURN 사용률이 63%까지
              올라와 릴레이 비용 모니터링이 필요합니다.
            </p>
          </div>

          <div className={styles.metricStrip} style={{ marginTop: 16 }}>
            <div className={styles.metricChip}>
              <div className={styles.metricChipLabel}>평균 대기 시간</div>
              <div className={styles.metricChipValue}>18초</div>
            </div>
            <div className={styles.metricChip}>
              <div className={styles.metricChipLabel}>매칭 성공률</div>
              <div className={styles.metricChipValue}>78%</div>
            </div>
            <div className={styles.metricChip}>
              <div className={styles.metricChipLabel}>세션 강제 종료</div>
              <div className={styles.metricChipValue}>6건</div>
            </div>
          </div>

          <div className={styles.chartBars} style={{ marginTop: 18 }}>
            {trafficPoints.map((point) => (
              <div key={point.hour} className={styles.barRow}>
                <span className={styles.muted}>{point.hour}:00</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${(point.visitors / 1600) * 100}%` }}
                  />
                </div>
                <strong className={styles.strong}>{point.visitors}</strong>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel
          title="서버 상태"
          subtitle="CPU, 메모리, WebRTC 릴레이 부하"
        >
          <div className={styles.progressList}>
            <div className={styles.progressRow}>
              <div className={styles.progressMeta}>
                <span>API CPU</span>
                <strong>{liveMetrics.cpuLoad}%</strong>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${liveMetrics.cpuLoad}%` }}
                />
              </div>
            </div>

            <div className={styles.progressRow}>
              <div className={styles.progressMeta}>
                <span>메모리 사용률</span>
                <strong>{liveMetrics.memoryLoad}%</strong>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${liveMetrics.memoryLoad}%` }}
                />
              </div>
            </div>

            <div className={styles.progressRow}>
              <div className={styles.progressMeta}>
                <span>WebRTC 릴레이 부하</span>
                <strong>{liveMetrics.webrtcLoad}%</strong>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${liveMetrics.webrtcLoad}%` }}
                />
              </div>
            </div>
          </div>

          <div className={styles.list} style={{ marginTop: 18 }}>
            <div className={styles.listItem}>
              <div className={styles.listItemColumn}>
                <p className={styles.itemTitle}>TURN relay saturation</p>
                <span className={styles.itemMeta}>
                  북미 리전 릴레이 사용률 63%
                </span>
              </div>
              <StatusBadge label="주의" tone="warning" />
            </div>
            <div className={styles.listItem}>
              <div className={styles.listItemColumn}>
                <p className={styles.itemTitle}>신고 큐 지연</p>
                <span className={styles.itemMeta}>
                  고위험 신고 평균 응답 7분
                </span>
              </div>
              <StatusBadge label="정상" tone="success" />
            </div>
          </div>
        </GlassPanel>
      </div>

      <div className={styles.tripleGrid}>
        <GlassPanel title="접속자 추세">
          <SparklineChart data={trafficPoints.map((point) => point.visitors)} />
          <p className={styles.muted} style={{ marginTop: 12 }}>
            24시간 기준 접속 추세. 점심 시간 이후 상승폭이 크고, 오후 9시에
            가장 높습니다.
          </p>
        </GlassPanel>

        <GlassPanel title="매칭 수 추세">
          <SparklineChart
            data={trafficPoints.map((point) => point.matches)}
            stroke="#9f8cff"
            fill="rgba(159, 140, 255, 0.16)"
          />
          <p className={styles.muted} style={{ marginTop: 12 }}>
            신규 가입자 유입과 함께 저녁대 매칭 수가 가파르게 증가합니다.
          </p>
        </GlassPanel>

        <GlassPanel title="운영 알림">
          <div className={styles.list}>
            <div className={styles.listItem}>
              <div className={styles.listItemColumn}>
                <p className={styles.itemTitle}>미성년자 의심 플래그</p>
                <span className={styles.itemMeta}>오늘 4건 신규 감지</span>
              </div>
              <StatusBadge label="검토 필요" tone="warning" />
            </div>
            <div className={styles.listItem}>
              <div className={styles.listItemColumn}>
                <p className={styles.itemTitle}>사기성 키워드 탐지</p>
                <span className={styles.itemMeta}>최근 1시간 13회 감지</span>
              </div>
              <StatusBadge label="상승" tone="danger" />
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
