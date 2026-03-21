"use client";

import { useState } from "react";
import { GlassPanel } from "../components/GlassPanel";
import { StatusBadge } from "../components/StatusBadge";
import {
  bannedWordsSeed,
  noticeSeed,
} from "../mock/adminData";
import styles from "./AdminPage.module.css";

export function SettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [genderFilterEnabled, setGenderFilterEnabled] = useState(true);
  const [safeMatching, setSafeMatching] = useState(true);
  const [bannedWords, setBannedWords] = useState(bannedWordsSeed);
  const [notices, setNotices] = useState(noticeSeed);
  const [newWord, setNewWord] = useState("");
  const [newNoticeTitle, setNewNoticeTitle] = useState("");
  const [newNoticeBody, setNewNoticeBody] = useState("");

  function appendWord() {
    const trimmed = newWord.trim();
    if (!trimmed || bannedWords.includes(trimmed)) return;
    setBannedWords((current) => [...current, trimmed]);
    setNewWord("");
  }

  function addNotice() {
    const title = newNoticeTitle.trim();
    const body = newNoticeBody.trim();
    if (!title || !body) return;
    setNotices((current) => [
      {
        id: `notice_${Date.now()}`,
        title,
        body,
        pinned: false,
      },
      ...current,
    ]);
    setNewNoticeTitle("");
    setNewNoticeBody("");
  }

  return (
    <div className={styles.page}>
      <div className={styles.doubleGrid}>
        <GlassPanel title="운영 토글" subtitle="점검 모드와 매칭 정책 전환">
          <div className={styles.stack}>
            <div className={styles.toggleRow}>
              <div>
                <strong className={styles.strong}>점검 모드</strong>
                <p className={styles.muted}>
                  사용자 신규 매칭을 막고 공지 페이지만 노출
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceMode((current) => !current)}
                className={[
                  styles.toggleButton,
                  maintenanceMode ? styles.toggleButtonActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>

            <div className={styles.toggleRow}>
              <div>
                <strong className={styles.strong}>성별 조건 허용</strong>
                <p className={styles.muted}>
                  유료 플랜 사용자에게만 조건 필터 제공
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGenderFilterEnabled((current) => !current)}
                className={[
                  styles.toggleButton,
                  genderFilterEnabled ? styles.toggleButtonActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>

            <div className={styles.toggleRow}>
              <div>
                <strong className={styles.strong}>세이프 매칭</strong>
                <p className={styles.muted}>
                  신고 이력 기반 보수적 매칭 규칙 적용
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSafeMatching((current) => !current)}
                className={[
                  styles.toggleButton,
                  safeMatching ? styles.toggleButtonActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel
          title="현재 정책 상태"
          subtitle="운영팀 공유용 요약"
        >
          <div className={styles.badgeRow}>
            <StatusBadge
              label={maintenanceMode ? "점검 중" : "서비스 오픈"}
              tone={maintenanceMode ? "warning" : "success"}
            />
            <StatusBadge
              label={genderFilterEnabled ? "성별 조건 ON" : "성별 조건 OFF"}
              tone={genderFilterEnabled ? "info" : "neutral"}
            />
            <StatusBadge
              label={safeMatching ? "세이프 매칭 ON" : "세이프 매칭 OFF"}
              tone={safeMatching ? "success" : "neutral"}
            />
          </div>

          <div className={styles.callout} style={{ marginTop: 16 }}>
            <h3 className={styles.calloutTitle}>운영 주의</h3>
            <p className={styles.calloutText}>
              점검 모드를 켜더라도 현재 진행 중인 세션은 종료되지 않습니다.
              강제 종료가 필요하면 세션 관리 메뉴에서 개별 종료가 필요합니다.
            </p>
          </div>
        </GlassPanel>
      </div>

      <div className={styles.doubleGrid}>
        <GlassPanel title="금지어 목록" subtitle="실시간 채팅 / 음성 ASR 필터링">
          <div className={styles.tableControls}>
            <input
              className={styles.input}
              placeholder="금지어 추가"
              value={newWord}
              onChange={(event) => setNewWord(event.target.value)}
            />
            <button className={styles.primaryButton} onClick={appendWord}>
              추가
            </button>
          </div>

          <div className={styles.badgeRow} style={{ marginTop: 16 }}>
            {bannedWords.map((word) => (
              <button
                key={word}
                className={styles.ghostButton}
                onClick={() =>
                  setBannedWords((current) =>
                    current.filter((entry) => entry !== word)
                  )
                }
              >
                #{word} 제거
              </button>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel title="공지사항 등록" subtitle="운영 공지와 시스템 안내">
          <div className={styles.stack}>
            <input
              className={styles.input}
              placeholder="공지 제목"
              value={newNoticeTitle}
              onChange={(event) => setNewNoticeTitle(event.target.value)}
            />
            <textarea
              className={styles.textarea}
              placeholder="공지 내용"
              value={newNoticeBody}
              onChange={(event) => setNewNoticeBody(event.target.value)}
            />
            <div className={styles.buttonRow}>
              <button className={styles.primaryButton} onClick={addNotice}>
                공지 등록
              </button>
            </div>
          </div>
        </GlassPanel>
      </div>

      <GlassPanel title="공지 목록" subtitle="최근 등록된 공지와 핀 상태">
        <div className={styles.noticeList}>
          {notices.map((notice) => (
            <div key={notice.id} className={styles.noticeItem}>
              <div className={styles.splitRow}>
                <strong className={styles.strong}>{notice.title}</strong>
                <StatusBadge
                  label={notice.pinned ? "고정" : "일반"}
                  tone={notice.pinned ? "info" : "neutral"}
                />
              </div>
              <p className={styles.calloutText} style={{ marginTop: 10 }}>
                {notice.body}
              </p>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}
