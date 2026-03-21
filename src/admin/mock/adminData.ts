export type UserStatus = "ACTIVE" | "SUSPENDED" | "PERMANENT_BANNED";
export type ReportStatus = "RECEIVED" | "REVIEWING" | "RESOLVED";
export type ReportReason = "NUDITY" | "HARASSMENT" | "SCAM" | "ABUSE";
export type AiVerdict = "VIOLATION" | "SUSPICIOUS" | "CLEAN";
export type SessionState = "LIVE" | "ESCALATED" | "QUEUED";
export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "MODERATOR";

export type DashboardSnapshot = {
  onlineUsers: number;
  activeCalls: number;
  todaySignups: number;
  totalUsers: number;
  todayMatches: number;
  averageCallMinutes: number;
  cpuLoad: number;
  memoryLoad: number;
  webrtcLoad: number;
};

export type TrafficPoint = {
  hour: string;
  visitors: number;
  matches: number;
};

export type UserRecord = {
  id: string;
  nickname: string;
  email: string;
  status: UserStatus;
  signupSource: "Google" | "Email" | "Guest Conversion";
  lastSeen: string;
  callCount: number;
  country: string;
  language: string;
  suspectedMinor: boolean;
  riskScore: number;
  recentCallMinutes: number[];
  notes: string;
};

export type ModerationReport = {
  id: string;
  sessionId: string;
  reportedUser: string;
  reason: ReportReason;
  status: ReportStatus;
  submittedAt: string;
  aiVerdict: AiVerdict;
  aiConfidence: number;
  repeatCount: number;
  summary: string;
  callLog: string[];
  tags: string[];
};

export type ActiveSession = {
  sessionId: string;
  state: SessionState;
  startedAt: string;
  durationMinutes: number;
  bitrateKbps: number;
  regionPair: string;
  waitingSeconds?: number;
};

export type QueueEntry = {
  id: string;
  region: string;
  language: string;
  waitedSeconds: number;
  priority: "NORMAL" | "HIGH" | "SAFE_MODE";
};

export type CountryDistribution = {
  label: string;
  users: number;
  matchSuccessRate: number;
};

export type LanguageDistribution = {
  label: string;
  users: number;
};

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  twoFactorEnabled: boolean;
  lastActive: string;
  incidentsHandled: number;
};

export type AuditLogRecord = {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
};

export const dashboardSnapshot: DashboardSnapshot = {
  onlineUsers: 1248,
  activeCalls: 316,
  todaySignups: 182,
  totalUsers: 48932,
  todayMatches: 2641,
  averageCallMinutes: 6.8,
  cpuLoad: 41,
  memoryLoad: 58,
  webrtcLoad: 63,
};

export const trafficPoints: TrafficPoint[] = [
  { hour: "00", visitors: 420, matches: 212 },
  { hour: "03", visitors: 280, matches: 137 },
  { hour: "06", visitors: 198, matches: 81 },
  { hour: "09", visitors: 512, matches: 301 },
  { hour: "12", visitors: 988, matches: 621 },
  { hour: "15", visitors: 1184, matches: 742 },
  { hour: "18", visitors: 1379, matches: 913 },
  { hour: "21", visitors: 1540, matches: 1021 },
];

export const users: UserRecord[] = [
  {
    id: "usr_01",
    nickname: "LimeMask",
    email: "lime@example.com",
    status: "ACTIVE",
    signupSource: "Google",
    lastSeen: "2분 전",
    callCount: 48,
    country: "KR",
    language: "한국어",
    suspectedMinor: false,
    riskScore: 8,
    recentCallMinutes: [4, 7, 9, 6, 8],
    notes: "최근 30일 간 신고 없음",
  },
  {
    id: "usr_02",
    nickname: "NightWave",
    email: "night@example.com",
    status: "SUSPENDED",
    signupSource: "Email",
    lastSeen: "27분 전",
    callCount: 112,
    country: "JP",
    language: "일본어",
    suspectedMinor: false,
    riskScore: 64,
    recentCallMinutes: [2, 1, 0, 3, 2],
    notes: "욕설 신고 누적 4건으로 24시간 정지",
  },
  {
    id: "usr_03",
    nickname: "MintFox",
    email: "mint@example.com",
    status: "ACTIVE",
    signupSource: "Guest Conversion",
    lastSeen: "1시간 전",
    callCount: 17,
    country: "US",
    language: "영어",
    suspectedMinor: true,
    riskScore: 71,
    recentCallMinutes: [1, 3, 2, 1, 2],
    notes: "나이 자가진술과 활동 패턴 불일치",
  },
  {
    id: "usr_04",
    nickname: "OrbitRoom",
    email: "orbit@example.com",
    status: "PERMANENT_BANNED",
    signupSource: "Email",
    lastSeen: "어제",
    callCount: 245,
    country: "BR",
    language: "포르투갈어",
    suspectedMinor: false,
    riskScore: 96,
    recentCallMinutes: [0, 0, 1, 0, 0],
    notes: "사기/결제 유도 반복으로 영구 정지",
  },
  {
    id: "usr_05",
    nickname: "GlassHarbor",
    email: "harbor@example.com",
    status: "ACTIVE",
    signupSource: "Google",
    lastSeen: "방금",
    callCount: 86,
    country: "DE",
    language: "영어",
    suspectedMinor: false,
    riskScore: 14,
    recentCallMinutes: [10, 9, 8, 12, 11],
    notes: "활동량 높지만 안정적",
  },
];

export const moderationReports: ModerationReport[] = [
  {
    id: "rep_1001",
    sessionId: "call_live_83af2",
    reportedUser: "OrbitRoom",
    reason: "SCAM",
    status: "REVIEWING",
    submittedAt: "3분 전",
    aiVerdict: "VIOLATION",
    aiConfidence: 0.94,
    repeatCount: 5,
    summary: "결제 링크 유도 및 외부 메신저 이동 시도",
    callLog: [
      "00:14 외부 결제 링크 언급",
      "00:37 텔레그램 아이디 공유 시도",
      "01:05 신고자가 세션 종료",
    ],
    tags: ["repeat-offender", "payment-risk"],
  },
  {
    id: "rep_1002",
    sessionId: "call_live_4ab98",
    reportedUser: "NightWave",
    reason: "HARASSMENT",
    status: "RECEIVED",
    submittedAt: "12분 전",
    aiVerdict: "SUSPICIOUS",
    aiConfidence: 0.77,
    repeatCount: 3,
    summary: "지속적 욕설과 성희롱 발언",
    callLog: [
      "00:22 고성 및 욕설 감지",
      "00:49 신고자 마이크 mute",
      "01:18 세션 이탈",
    ],
    tags: ["repeat-offender"],
  },
  {
    id: "rep_1003",
    sessionId: "call_live_91de0",
    reportedUser: "Unknown-5X",
    reason: "NUDITY",
    status: "RESOLVED",
    submittedAt: "39분 전",
    aiVerdict: "VIOLATION",
    aiConfidence: 0.98,
    repeatCount: 1,
    summary: "노출성 화면 송출",
    callLog: [
      "00:08 NSFW confidence 0.98",
      "00:10 자동 강제 종료",
      "00:14 관리자 영구 차단 완료",
    ],
    tags: ["auto-kicked"],
  },
  {
    id: "rep_1004",
    sessionId: "call_live_f2c17",
    reportedUser: "MintFox",
    reason: "ABUSE",
    status: "RECEIVED",
    submittedAt: "1시간 전",
    aiVerdict: "CLEAN",
    aiConfidence: 0.31,
    repeatCount: 2,
    summary: "미성년자 의심 발언 신고",
    callLog: [
      "00:41 나이 관련 대화 패턴 감지",
      "01:12 신고자 수동 리포트 제출",
    ],
    tags: ["minor-risk"],
  },
];

export const activeSessions: ActiveSession[] = [
  {
    sessionId: "sess_a19f",
    state: "LIVE",
    startedAt: "09:14",
    durationMinutes: 7,
    bitrateKbps: 1320,
    regionPair: "KR ↔ JP",
  },
  {
    sessionId: "sess_b88d",
    state: "LIVE",
    startedAt: "09:17",
    durationMinutes: 4,
    bitrateKbps: 980,
    regionPair: "US ↔ BR",
  },
  {
    sessionId: "sess_c12a",
    state: "ESCALATED",
    startedAt: "09:11",
    durationMinutes: 9,
    bitrateKbps: 845,
    regionPair: "DE ↔ KR",
  },
];

export const queueEntries: QueueEntry[] = [
  { id: "queue_01", region: "KR", language: "한국어", waitedSeconds: 11, priority: "NORMAL" },
  { id: "queue_02", region: "US", language: "영어", waitedSeconds: 28, priority: "SAFE_MODE" },
  { id: "queue_03", region: "JP", language: "일본어", waitedSeconds: 7, priority: "NORMAL" },
  { id: "queue_04", region: "BR", language: "포르투갈어", waitedSeconds: 33, priority: "HIGH" },
];

export const countryDistribution: CountryDistribution[] = [
  { label: "대한민국", users: 1924, matchSuccessRate: 82 },
  { label: "미국", users: 1450, matchSuccessRate: 78 },
  { label: "일본", users: 1132, matchSuccessRate: 74 },
  { label: "브라질", users: 806, matchSuccessRate: 69 },
  { label: "독일", users: 516, matchSuccessRate: 76 },
];

export const languageDistribution: LanguageDistribution[] = [
  { label: "한국어", users: 2240 },
  { label: "영어", users: 1986 },
  { label: "일본어", users: 938 },
  { label: "포르투갈어", users: 611 },
  { label: "독일어", users: 287 },
];

export const adminAccounts: AdminAccount[] = [
  {
    id: "adm_01",
    name: "Yuna Park",
    email: "yuna@unface.io",
    role: "SUPER_ADMIN",
    twoFactorEnabled: true,
    lastActive: "방금",
    incidentsHandled: 124,
  },
  {
    id: "adm_02",
    name: "Minseo Lee",
    email: "minseo@unface.io",
    role: "ADMIN",
    twoFactorEnabled: true,
    lastActive: "8분 전",
    incidentsHandled: 71,
  },
  {
    id: "adm_03",
    name: "Alex Tan",
    email: "alex@unface.io",
    role: "MODERATOR",
    twoFactorEnabled: false,
    lastActive: "26분 전",
    incidentsHandled: 43,
  },
];

export const auditLogs: AuditLogRecord[] = [
  {
    id: "log_01",
    actor: "Yuna Park",
    action: "점검 모드 비활성화",
    target: "system.settings",
    createdAt: "오늘 09:08",
    severity: "MEDIUM",
  },
  {
    id: "log_02",
    actor: "Minseo Lee",
    action: "NightWave 24시간 정지",
    target: "usr_02",
    createdAt: "오늘 08:42",
    severity: "HIGH",
  },
  {
    id: "log_03",
    actor: "Alex Tan",
    action: "금지어 3건 추가",
    target: "content.filter",
    createdAt: "오늘 08:19",
    severity: "LOW",
  },
];

export const noticeSeed = [
  {
    id: "notice_01",
    title: "매칭 안정화 패치",
    body: "오늘 02:00 KST에 매칭 큐 안전장치 패치가 배포되었습니다.",
    pinned: true,
  },
  {
    id: "notice_02",
    title: "신고 처리 SLA 업데이트",
    body: "고위험 신고는 10분 이내 확인 원칙으로 조정되었습니다.",
    pinned: false,
  },
];

export const bannedWordsSeed = [
  "텔레그램",
  "외부결제",
  "카카오 오픈채팅",
  "후원 링크",
  "DM me",
];
