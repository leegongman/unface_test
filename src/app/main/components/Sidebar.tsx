// 파일 경로: src/app/main/components/Sidebar.tsx
import type { ActivePanel } from "../types"

interface SidebarProps {
  activePanel: ActivePanel
  onTogglePanel: (panel: ActivePanel) => void
  profileAvatar: string
  nickname: string
  onOpenProfile: () => void
  onSignOut: () => void
  onGoHome: () => void
}

const menuItems: Array<{ key: Exclude<ActivePanel, null>; label: string; sub: string }> = [
  { key: "avatar", label: "아바타", sub: "얼굴 변환" },
  { key: "voice", label: "음성", sub: "목소리 변조" },
  { key: "translate", label: "번역", sub: "자막 / 음성" },
]

export function Sidebar({
  activePanel,
  onTogglePanel,
  profileAvatar,
  nickname,
  onOpenProfile,
  onSignOut,
  onGoHome,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={onGoHome}>unface</div>
      <div className="menu-list">
        {menuItems.map(({ key, label, sub }) => (
          <div key={key} className={`menu-item${activePanel === key ? " active" : ""}`} onClick={() => onTogglePanel(key)}>
            <div className="menu-label">{label}</div>
            <div className="menu-sub">{sub}</div>
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="profile-row" onClick={onOpenProfile}>
          <div className="profile-pic">
            {profileAvatar}<div className="online-dot" />
          </div>
          <span className="profile-name" style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nickname}</span>
          <button
            onClick={(event) => {
              event.stopPropagation()
              onSignOut()
            }}
            title="로그아웃"
            style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: 7, border: "1px solid var(--card-border)",
              background: "none", color: "var(--text-dim)", fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(event) => { event.currentTarget.style.background = "var(--menu-hover)"; event.currentTarget.style.color = "var(--text-primary)" }}
            onMouseLeave={(event) => { event.currentTarget.style.background = "none"; event.currentTarget.style.color = "var(--text-dim)" }}
          >↩</button>
        </div>
      </div>
    </aside>
  )
}
