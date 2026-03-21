// 파일 경로: src/app/main/components/ProfileOverlay.tsx
import type { ProfileSummary } from "../types"

interface ProfileOverlayProps {
  isOpen: boolean
  onClose: () => void
  profileAvatar: string
  nickname: string
  profileSummary: ProfileSummary
  currentLocationLabel: string
  currentRegionLabel: string
  currentLanguageLabel: string
  currentGenderLabel: string
  matchingGenderLabel: string
  planName: string
  planDesc: string
  planBadge: string
  planFeatures: string[]
  onOpenAllPlans: () => void
  onEditProfile: () => void
}

export function ProfileOverlay({
  isOpen,
  onClose,
  profileAvatar,
  nickname,
  profileSummary,
  currentLocationLabel,
  currentRegionLabel,
  currentLanguageLabel,
  currentGenderLabel,
  matchingGenderLabel,
  planName,
  planDesc,
  planBadge,
  planFeatures,
  onOpenAllPlans,
  onEditProfile,
}: ProfileOverlayProps) {
  return (
    <div className={`profile-overlay${isOpen ? " active" : ""}`}>
      <div className="profile-overlay-topbar">
        <span className="profile-overlay-logo">unface</span>
        <button className="profile-close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="profile-overlay-body">
        <div className="po-header">
          <div className="po-pic">{profileAvatar}</div>
          <div className="po-name">{nickname}</div>
          <div className="po-tag">unface 멤버</div>
        </div>

        <div className="po-cards">
          <div className="po-card">
            <div className="po-card-label">내 정보</div>
            <div className="po-row">
              <span className="po-key">국가</span>
              <span className="po-val">{currentLocationLabel}</span>
            </div>
            <div className="po-row">
              <span className="po-key">언어</span>
              <span className="po-val">{currentLanguageLabel}</span>
            </div>
            <div className="po-row">
              <span className="po-key">성별</span>
              <span className="po-val">{currentGenderLabel}</span>
            </div>
          </div>

          <div className="po-card">
            <div className="po-card-label">매칭 범위</div>
            <div className="po-row">
              <span className="po-key">지역</span>
              <span className="po-val">{currentRegionLabel} · 전체</span>
            </div>
            <div className="po-row">
              <span className="po-key">선호 성별</span>
              <span className="po-val">{matchingGenderLabel}</span>
            </div>
          </div>

          <div
            className="po-card"
            style={{
              background: profileSummary.subscription ? "var(--pro-bg)" : "var(--card-bg)",
              borderColor: profileSummary.subscription ? "var(--pro-border)" : "var(--card-border)",
            }}
          >
            <div className="po-card-label">현재 플랜</div>
            <div className="po-plan-top">
              <div>
                <div className="po-plan-name">{planName}</div>
                <div className="po-plan-desc">{planDesc}</div>
              </div>
              <div
                className="po-plan-badge"
                style={profileSummary.subscription ? undefined : {
                  background: "var(--card-bg)",
                  borderColor: "var(--card-border)",
                  color: "var(--text-sub)",
                }}
              >
                {planBadge}
              </div>
            </div>
            <div className="po-plan-feats">
              {planFeatures.map((feature) => (
                <div key={feature} className="po-feat">{feature}</div>
              ))}
            </div>
            <button className="po-all-plans-btn" onClick={onOpenAllPlans}>
              모든 플랜 확인하기 →
            </button>
          </div>
        </div>

        <button className="po-edit-btn" onClick={onEditProfile}>
          내 정보 변경 →
        </button>
      </div>
    </div>
  )
}
