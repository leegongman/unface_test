// 파일 경로: src/app/main/components/RecentCallsPanel.tsx
interface RecentCallItem {
  id: string
  name: string
  meta: string
  duration: string
}

interface RecentCallsPanelProps {
  isOpen: boolean
  recentCalls: RecentCallItem[]
}

export function RecentCallsPanel({
  isOpen,
  recentCalls,
}: RecentCallsPanelProps) {
  return (
    <div className={`tab-overlay${isOpen ? " open" : ""}`}>
      <div className="overlay-header">최근 통화</div>
      <div className="overlay-list">
        {recentCalls.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📞</div>
            <div className="empty-state-text">아직 통화 기록이 없어요.<br />첫 통화를 시작해보세요!</div>
          </div>
        ) : recentCalls.map((call, index) => (
          <div key={index} className="call-item">
            <div className="call-avatar">🙂</div>
            <div className="call-info">
              <div className="call-name">{call.name}</div>
              <div className="call-meta">{call.meta}</div>
            </div>
            <span className="call-duration">{call.duration}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
