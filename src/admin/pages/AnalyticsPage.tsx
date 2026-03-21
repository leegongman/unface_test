"use client";

import { GlassPanel } from "../components/GlassPanel";
import { SparklineChart } from "../components/SparklineChart";
import {
  countryDistribution,
  languageDistribution,
  trafficPoints,
} from "../mock/adminData";
import styles from "./AdminPage.module.css";

export function AnalyticsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.statsGrid}>
        <GlassPanel title="매칭 성공률">
          <div className={styles.metricChipValue}>78%</div>
          <p className={styles.muted}>지난 7일 평균, 전주 대비 +4%</p>
        </GlassPanel>
        <GlassPanel title="평균 대기 시간">
          <div className={styles.metricChipValue}>18초</div>
          <p className={styles.muted}>세이프 모드 세션은 평균 26초</p>
        </GlassPanel>
        <GlassPanel title="이탈률">
          <div className={styles.metricChipValue}>21%</div>
          <p className={styles.muted}>매칭 후 30초 이내 종료 기준</p>
        </GlassPanel>
        <GlassPanel title="재방문율">
          <div className={styles.metricChipValue}>44%</div>
          <p className={styles.muted}>최근 14일 내 재접속 사용자 비중</p>
        </GlassPanel>
      </div>

      <div className={styles.doubleGrid}>
        <GlassPanel
          title="시간대별 접속자 트래픽"
          subtitle="접속자와 매칭량을 함께 본 운영 지표"
        >
          <SparklineChart
            data={trafficPoints.map((point) => point.visitors)}
            stroke="#49e3c1"
            fill="rgba(73, 227, 193, 0.14)"
          />
          <div className={styles.chartBars} style={{ marginTop: 18 }}>
            {trafficPoints.map((point) => (
              <div key={point.hour} className={styles.barRow}>
                <span className={styles.muted}>{point.hour}:00</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${(point.matches / 1100) * 100}%` }}
                  />
                </div>
                <strong className={styles.strong}>{point.matches}</strong>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel
          title="이탈률 분석"
          subtitle="사용자가 통화를 끝내는 주요 패턴"
        >
          <div className={styles.progressList}>
            <div className={styles.progressRow}>
              <div className={styles.progressMeta}>
                <span>대기 시간 초과</span>
                <strong>42%</strong>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: "42%" }} />
              </div>
            </div>
            <div className={styles.progressRow}>
              <div className={styles.progressMeta}>
                <span>품질 저하 / 끊김</span>
                <strong>25%</strong>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: "25%" }} />
              </div>
            </div>
            <div className={styles.progressRow}>
              <div className={styles.progressMeta}>
                <span>상대 이탈</span>
                <strong>19%</strong>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: "19%" }} />
              </div>
            </div>
            <div className={styles.progressRow}>
              <div className={styles.progressMeta}>
                <span>정책 위반 감지</span>
                <strong>14%</strong>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: "14%" }} />
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>

      <div className={styles.doubleGrid}>
        <GlassPanel
          title="국가별 분포"
          subtitle="사용자 수와 매칭 성공률을 함께 표시"
        >
          <div className={styles.chartBars}>
            {countryDistribution.map((country) => (
              <div key={country.label} className={styles.barRow}>
                <span className={styles.muted}>{country.label}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${(country.users / 2000) * 100}%` }}
                  />
                </div>
                <strong className={styles.strong}>
                  {country.matchSuccessRate}%
                </strong>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel
          title="언어별 사용자 분포"
          subtitle="언어 큐 밸런싱에 바로 쓰는 지표"
        >
          <div className={styles.list}>
            {languageDistribution.map((language) => (
              <div key={language.label} className={styles.listItem}>
                <div className={styles.listItemColumn}>
                  <p className={styles.itemTitle}>{language.label}</p>
                  <span className={styles.itemMeta}>
                    {language.users.toLocaleString("ko-KR")} active users
                  </span>
                </div>
                <strong className={styles.strong}>
                  {Math.round((language.users / 6062) * 100)}%
                </strong>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
