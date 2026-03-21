// 파일 경로: src/app/main/components/MatchingOverlay.tsx
import { fmtTimer } from "../constants"

interface MatchingOverlayProps {
  matchTimer: number
  avatarEmoji: string
  onCancel: () => void
}

export function MatchingOverlay({
  matchTimer,
  avatarEmoji,
  onCancel,
}: MatchingOverlayProps) {
  return (
    <div className="matching-overlay">
      <div className="sonar-wrap">
        <div className="sonar-ring" /><div className="sonar-ring" /><div className="sonar-ring" /><div className="sonar-ring" />
        <div className="sonar-center">{avatarEmoji}</div>
      </div>
      <div className="matching-status">
        <div className="matching-title">익명의 친구를 찾는 중...</div>
        <div className="matching-sub">전 세계 어딘가의 누군가와 연결 중이에요</div>
        <div className="matching-timer">{fmtTimer(matchTimer)}</div>
      </div>
      <button className="cancel-btn" onClick={onCancel}>매칭 취소</button>
    </div>
  )
}
