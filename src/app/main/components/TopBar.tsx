// 파일 경로: src/app/main/components/TopBar.tsx
import type { ActiveTab } from "../types"

interface PaymentItem {
  name: string
  type: string
  price: string
  thumb: string
  priceValue: number
  itemType: string
  refName: string
  avatarCategory?: string
  creditAmount?: number
  planName?: string
}

interface TopBarProps {
  activeTab: ActiveTab
  onSwitchTab: (tab: ActiveTab) => void
  receivedRequestsCount: number
  credits: number
  theme: string
  onToggleTheme: () => void
  onOpenPayment: (item: PaymentItem) => void
}

export function TopBar({
  activeTab,
  onSwitchTab,
  receivedRequestsCount,
  credits,
  theme,
  onToggleTheme,
  onOpenPayment,
}: TopBarProps) {
  return (
    <div className="topbar">
      <div className="tabs">
        <div className={`tab${activeTab === "recent" ? " active" : ""}`} onClick={() => onSwitchTab("recent")}>최근 통화</div>
        <div className={`tab${activeTab === "friends" ? " active" : ""}`} onClick={() => onSwitchTab("friends")}>
          친구{receivedRequestsCount > 0 && <span className="tab-badge">{receivedRequestsCount}</span>}
        </div>
      </div>
      <div className="topbar-right">
        <div className="plan-badge-top" onClick={() => onOpenPayment({ name: "Pro 플랜", type: "구독 · 월간 결제", price: "$1", thumb: "✦", priceValue: 1, itemType: "plan", refName: "Pro", planName: "Pro" })}>✦ Pro</div>
        <div className="credit-badge" onClick={() => onOpenPayment({ name: "통화 크레딧 50회", type: "통화 크레딧", price: "$1", thumb: "📞", priceValue: 1, itemType: "credit", refName: "credits", creditAmount: 50 })}>
          <span>📞</span>
          <span className="credit-val">{credits}</span>
          <span style={{ fontSize: 11, color: "var(--text-dim)" }}>통화</span>
        </div>
        <button className="theme-toggle" onClick={onToggleTheme}>
          {theme === "dark" ? "🌙" : "☀️"}
        </button>
      </div>
    </div>
  )
}
