// 파일 경로: src/app/main/constants.ts
import type { FriendRecord, RecentCallRecord } from "./types"

export const AVATARS = [
  { emoji: "😶", name: "기본", price: "$1", category: "MASK", free: true },
  { emoji: "🐱", name: "고양이", price: "$1", category: "ANIMAL", free: true },
  { emoji: "😷", name: "흰색 마스크", price: "무료", category: "MASK", free: true },
  { emoji: "😷", name: "검정 마스크", price: "무료", category: "MASK", free: true },
  { emoji: "🦊", name: "여우", price: "$1", category: "ANIMAL", free: true },
  { emoji: "🤖", name: "로봇", price: "$1", category: "MASK", free: true },
  { emoji: "🐙", name: "문어", price: "$1", category: "ANIMAL", free: true },
  { emoji: "🦁", name: "사자", price: "$1", category: "ANIMAL", free: true },
  { emoji: "👾", name: "에일리언", price: "$1", category: "MASK", free: true },
  { emoji: "🎃", name: "호박", price: "$1", category: "MASK", free: true },
  { emoji: "🧸", name: "곰인형", price: "$1", category: "ANIMAL", free: true },
]

export const CELEBS = [
  { name: "장원영", group: "아이브", price: "$1", face: "✦", grad: "linear-gradient(135deg,#fde68a,#f59e0b)" },
  { name: "뷔", group: "BTS", price: "$1", face: "✦", grad: "linear-gradient(135deg,#c4b5fd,#8b5cf6)" },
  { name: "카리나", group: "에스파", price: "$1", face: "✦", grad: "linear-gradient(135deg,#fbcfe8,#ec4899)" },
  { name: "차은우", group: "아스트로", price: "$1", face: "✦", grad: "linear-gradient(135deg,#a5f3fc,#06b6d4)" },
  { name: "윈터", group: "에스파", price: "$1", face: "✦", grad: "linear-gradient(135deg,#bbf7d0,#22c55e)" },
  { name: "지민", group: "BTS", price: "$1", face: "✦", grad: "linear-gradient(135deg,#fecaca,#ef4444)" },
]

export const VOICES = [
  { dot: "🎙️", name: "원본", desc: "변조 없이 내 목소리 그대로" },
  { dot: "🔵", name: "낮은 목소리", desc: "남성적인 저음으로 변환" },
  { dot: "🩷", name: "높은 목소리", desc: "여성적인 고음으로 변환" },
  { dot: "🤖", name: "로봇", desc: "기계음으로 완전 변환" },
  { dot: "🧒", name: "어린이", desc: "귀엽고 높은 아이 목소리" },
]

// 서버 대륙 (매칭 지역 선택용)
export const CONTINENT_LABELS: Record<string, { emoji: string; label: string }> = {
  AS: { emoji: "🌏", label: "아시아" },
  EU: { emoji: "🌍", label: "유럽" },
  NA: { emoji: "🌎", label: "북아메리카" },
  SA: { emoji: "🌎", label: "남아메리카" },
  AF: { emoji: "🌍", label: "아프리카" },
  OC: { emoji: "🌏", label: "오세아니아" },
}

// 실제 국가 목록 (프로필 국가 설정용)
export const COUNTRY_LABELS: Record<string, { emoji: string; label: string }> = {
  KR: { emoji: "🇰🇷", label: "대한민국" },
  JP: { emoji: "🇯🇵", label: "일본" },
  CN: { emoji: "🇨🇳", label: "중국" },
  TW: { emoji: "🇹🇼", label: "대만" },
  HK: { emoji: "🇭🇰", label: "홍콩" },
  SG: { emoji: "🇸🇬", label: "싱가포르" },
  TH: { emoji: "🇹🇭", label: "태국" },
  VN: { emoji: "🇻🇳", label: "베트남" },
  PH: { emoji: "🇵🇭", label: "필리핀" },
  ID: { emoji: "🇮🇩", label: "인도네시아" },
  MY: { emoji: "🇲🇾", label: "말레이시아" },
  IN: { emoji: "🇮🇳", label: "인도" },
  PK: { emoji: "🇵🇰", label: "파키스탄" },
  BD: { emoji: "🇧🇩", label: "방글라데시" },
  US: { emoji: "🇺🇸", label: "미국" },
  CA: { emoji: "🇨🇦", label: "캐나다" },
  MX: { emoji: "🇲🇽", label: "멕시코" },
  GB: { emoji: "🇬🇧", label: "영국" },
  DE: { emoji: "🇩🇪", label: "독일" },
  FR: { emoji: "🇫🇷", label: "프랑스" },
  IT: { emoji: "🇮🇹", label: "이탈리아" },
  ES: { emoji: "🇪🇸", label: "스페인" },
  PT: { emoji: "🇵🇹", label: "포르투갈" },
  NL: { emoji: "🇳🇱", label: "네덜란드" },
  SE: { emoji: "🇸🇪", label: "스웨덴" },
  NO: { emoji: "🇳🇴", label: "노르웨이" },
  PL: { emoji: "🇵🇱", label: "폴란드" },
  UA: { emoji: "🇺🇦", label: "우크라이나" },
  RU: { emoji: "🇷🇺", label: "러시아" },
  GR: { emoji: "🇬🇷", label: "그리스" },
  TR: { emoji: "🇹🇷", label: "튀르키예" },
  SA: { emoji: "🇸🇦", label: "사우디아라비아" },
  EG: { emoji: "🇪🇬", label: "이집트" },
  NG: { emoji: "🇳🇬", label: "나이지리아" },
  ZA: { emoji: "🇿🇦", label: "남아프리카공화국" },
  BR: { emoji: "🇧🇷", label: "브라질" },
  AR: { emoji: "🇦🇷", label: "아르헨티나" },
  CL: { emoji: "🇨🇱", label: "칠레" },
  CO: { emoji: "🇨🇴", label: "콜롬비아" },
  AU: { emoji: "🇦🇺", label: "호주" },
  NZ: { emoji: "🇳🇿", label: "뉴질랜드" },
}

// 하위 호환용 (구 continent 코드 → 국가 표시)
export const LOCATION_LABELS: Record<string, { emoji: string; label: string }> = {
  ...CONTINENT_LABELS,
  ...COUNTRY_LABELS,
}

export const LANGUAGE_LABELS: Record<string, string> = {
  ko: "한국어",
  en: "영어",
  ja: "일본어",
  zh: "중국어",
  es: "스페인어",
  fr: "프랑스어",
  de: "독일어",
  pt: "포르투갈어",
  ar: "아랍어",
  hi: "힌디어",
}

export const GENDER_LABELS: Record<string, string> = {
  MALE: "남성",
  FEMALE: "여성",
  OTHER: "상관없음",
}

export function getLocationLabel(code?: string | null) {
  const normalized = code?.toUpperCase() ?? ""
  const found = COUNTRY_LABELS[normalized] ?? CONTINENT_LABELS[normalized]
  if (found) return `${found.emoji} ${found.label}`
  return normalized || "미설정"
}

export function getServerRegionsLabel(regions?: string[] | null) {
  if (!regions || regions.length === 0) return "미설정"
  return regions
    .map((r) => CONTINENT_LABELS[r.toUpperCase()]?.label ?? r)
    .join(", ")
}

export function getRegionLabel(code?: string | null) {
  const normalized = code?.toUpperCase() ?? "AS"
  return LOCATION_LABELS[normalized]?.label ?? normalized
}

export function getLanguageLabel(language?: string | null) {
  if (!language) return "한국어"
  return LANGUAGE_LABELS[language] ?? language
}

export function getGenderLabel(gender?: string | null) {
  if (!gender) return "상관없음"
  return GENDER_LABELS[gender] ?? gender
}

export function fmtTimer(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

export function mapRecentCalls(calls: RecentCallRecord[]) {
  return calls.map((call) => ({
    id: call.id,
    name: call.peer?.nickname ?? "익명",
    meta: call.peer?.countryCode ? call.peer.countryCode : "상관없음",
    duration: call.durationSec != null ? fmtTimer(call.durationSec) : "00:00",
  }))
}

export function mapFriends(friends: FriendRecord[]) {
  return friends.map((friend) => ({
    id: friend.id,
    name: friend.nickname ?? "익명",
    status: "온라인",
    online: true,
    emoji: "🙂",
    countryCode: friend.countryCode ?? undefined,
    gender: friend.gender ?? undefined,
  }))
}
