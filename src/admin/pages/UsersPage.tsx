"use client";

import { useState } from "react";
import { GlassPanel } from "../components/GlassPanel";
import { SparklineChart } from "../components/SparklineChart";
import { StatusBadge } from "../components/StatusBadge";
import { UserRecord, users as userSeed } from "../mock/adminData";
import styles from "./AdminPage.module.css";

function userTone(status: UserRecord["status"]) {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED") return "warning";
  return "danger";
}

function userLabel(status: UserRecord["status"]) {
  if (status === "ACTIVE") return "정상";
  if (status === "SUSPENDED") return "정지";
  return "영구 정지";
}

export function UsersPage() {
  const [records, setRecords] = useState(userSeed);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [flagFilter, setFlagFilter] = useState("ALL");
  const [selectedUserId, setSelectedUserId] = useState(userSeed[0]?.id ?? "");

  const filteredUsers = records.filter((user) => {
    const query = search.trim().toLowerCase();
    const matchesQuery =
      query.length === 0 ||
      user.nickname.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === "ALL" || user.status === statusFilter;
    const matchesFlag =
      flagFilter === "ALL" ||
      (flagFilter === "FLAGGED" && user.suspectedMinor) ||
      (flagFilter === "CLEAN" && !user.suspectedMinor);
    return matchesQuery && matchesStatus && matchesFlag;
  });

  const selectedUser =
    filteredUsers.find((user) => user.id === selectedUserId) ?? filteredUsers[0];

  function updateUserStatus(nextStatus: UserRecord["status"]) {
    if (!selectedUser) return;

    setRecords((current) =>
      current.map((user) =>
        user.id === selectedUser.id ? { ...user, status: nextStatus } : user
      )
    );
  }

  return (
    <div className={styles.page}>
      <GlassPanel
        title="회원 목록"
        subtitle="검색, 필터링, 제재 조치를 한 화면에서 처리"
      >
        <div className={styles.tableControls}>
          <input
            className={styles.input}
            placeholder="닉네임 또는 이메일 검색"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className={styles.select}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">전체 상태</option>
            <option value="ACTIVE">정상</option>
            <option value="SUSPENDED">정지</option>
            <option value="PERMANENT_BANNED">영구 정지</option>
          </select>
          <select
            className={styles.select}
            value={flagFilter}
            onChange={(event) => setFlagFilter(event.target.value)}
          >
            <option value="ALL">전체 플래그</option>
            <option value="FLAGGED">미성년자 의심만</option>
            <option value="CLEAN">정상 계정만</option>
          </select>
        </div>

        <div className={styles.doubleGrid} style={{ marginTop: 18 }}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>회원</th>
                  <th>상태</th>
                  <th>가입 경로</th>
                  <th>마지막 접속</th>
                  <th>통화</th>
                  <th>플래그</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={[
                      styles.clickableRow,
                      selectedUser?.id === user.id ? styles.selectedRow : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <td>
                      <div className={styles.listItemColumn}>
                        <strong className={styles.strong}>{user.nickname}</strong>
                        <span className={styles.muted}>{user.email}</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge
                        label={userLabel(user.status)}
                        tone={userTone(user.status)}
                      />
                    </td>
                    <td>{user.signupSource}</td>
                    <td>{user.lastSeen}</td>
                    <td>{user.callCount}회</td>
                    <td>
                      {user.suspectedMinor ? (
                        <StatusBadge label="미성년자 의심" tone="warning" />
                      ) : (
                        <StatusBadge label="정상" tone="neutral" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <GlassPanel
            title={selectedUser ? `${selectedUser.nickname} 상세` : "선택된 사용자 없음"}
            subtitle="가입 정보, 최근 접속, 통화 추세"
          >
            {selectedUser ? (
              <div className={styles.stack}>
                <div className={styles.detailGrid}>
                  <div className={styles.detailCard}>
                    <span className={styles.detailLabel}>국가 / 언어</span>
                    <strong className={styles.detailValue}>
                      {selectedUser.country} / {selectedUser.language}
                    </strong>
                  </div>
                  <div className={styles.detailCard}>
                    <span className={styles.detailLabel}>리스크 점수</span>
                    <strong className={styles.detailValue}>
                      {selectedUser.riskScore}/100
                    </strong>
                  </div>
                  <div className={styles.detailCard}>
                    <span className={styles.detailLabel}>누적 통화 횟수</span>
                    <strong className={styles.detailValue}>
                      {selectedUser.callCount}회
                    </strong>
                  </div>
                  <div className={styles.detailCard}>
                    <span className={styles.detailLabel}>가입 경로</span>
                    <strong className={styles.detailValue}>
                      {selectedUser.signupSource}
                    </strong>
                  </div>
                </div>

                <div>
                  <div className={styles.splitRow}>
                    <strong className={styles.strong}>최근 통화 길이 추세</strong>
                    <StatusBadge
                      label={
                        selectedUser.suspectedMinor
                          ? "추가 검토 필요"
                          : "안정적"
                      }
                      tone={selectedUser.suspectedMinor ? "warning" : "success"}
                    />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <SparklineChart
                      data={selectedUser.recentCallMinutes}
                      stroke="#8f7fff"
                      fill="rgba(143, 127, 255, 0.18)"
                    />
                  </div>
                </div>

                <div className={styles.callout}>
                  <h3 className={styles.calloutTitle}>운영 메모</h3>
                  <p className={styles.calloutText}>{selectedUser.notes}</p>
                </div>

                <div className={styles.buttonRow}>
                  <button
                    className={styles.warningButton}
                    onClick={() => updateUserStatus("SUSPENDED")}
                  >
                    계정 정지
                  </button>
                  <button
                    className={styles.dangerButton}
                    onClick={() => updateUserStatus("PERMANENT_BANNED")}
                  >
                    영구 정지
                  </button>
                  <button
                    className={styles.ghostButton}
                    onClick={() => updateUserStatus("ACTIVE")}
                  >
                    제재 해제
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>조건에 맞는 사용자가 없습니다.</div>
            )}
          </GlassPanel>
        </div>
      </GlassPanel>
    </div>
  );
}
