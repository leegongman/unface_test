// 파일 경로: src/app/main/components/ProfileOverlay.tsx
import { useState } from "react"
import type { CSSProperties } from "react"

import { CONTINENT_LABELS, COUNTRY_LABELS, GENDER_LABELS, LANGUAGE_LABELS, getServerRegionsLabel } from "../constants"
import type { ProfileSummary } from "../types"

interface ProfileOverlayProps {
  isOpen: boolean
  onClose: () => void
  onGoHome: () => void
  profileAvatar: string
  nickname: string
  profileSummary: ProfileSummary
  preferGender: string
  currentLocationLabel: string
  currentLanguageLabel: string
  currentGenderLabel: string
  matchingGenderLabel: string
  planName: string
  planDesc: string
  planBadge: string
  planFeatures: string[]
  onOpenAllPlans: () => void
  onSave: (updates: { countryCode: string; language: string; gender: string; preferGender: string; serverRegions: string[] }) => Promise<void>
}

const CONTINENT_OPTIONS = Object.entries(CONTINENT_LABELS).map(([code, { emoji, label }]) => ({ code, emoji, label }))

export function ProfileOverlay({
  isOpen,
  onClose,
  onGoHome,
  profileAvatar,
  nickname,
  profileSummary,
  preferGender,
  currentLocationLabel,
  currentLanguageLabel,
  currentGenderLabel,
  matchingGenderLabel,
  planName,
  planDesc,
  planBadge,
  planFeatures,
  onOpenAllPlans,
  onSave,
}: ProfileOverlayProps) {
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState({
    countryCode: "KR",
    language: "ko",
    gender: "OTHER",
    preferGender: "OTHER",
    serverRegions: ["AS"] as string[],
  })
  const [countrySearch, setCountrySearch] = useState("")
  const [showCountryList, setShowCountryList] = useState(false)

  const openEdit = () => {
    setDraft({
      countryCode: profileSummary.countryCode ?? "KR",
      language: profileSummary.language ?? "ko",
      gender: profileSummary.gender ?? "OTHER",
      preferGender: preferGender ?? "OTHER",
      serverRegions: profileSummary.serverRegions.length > 0 ? profileSummary.serverRegions : ["AS"],
    })
    setCountrySearch("")
    setShowCountryList(false)
    setEditMode(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(draft)
      setEditMode(false)
    } finally {
      setSaving(false)
    }
  }

  const toggleContinent = (code: string) => {
    setDraft((d) => {
      const already = d.serverRegions.includes(code)
      if (already) {
        if (d.serverRegions.length === 1) return d // 최소 1개 유지
        return { ...d, serverRegions: d.serverRegions.filter((r) => r !== code) }
      }
      return { ...d, serverRegions: [...d.serverRegions, code] }
    })
  }

  const genderOptions = [
    { value: "MALE", label: GENDER_LABELS.MALE },
    { value: "FEMALE", label: GENDER_LABELS.FEMALE },
    { value: "OTHER", label: GENDER_LABELS.OTHER },
  ]

  const selectStyle: CSSProperties = {
    width: "100%",
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid var(--glass-card-border)",
    background: "var(--glass-card-bg)",
    color: "var(--text-primary)",
    fontSize: 13,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  }

  const filteredCountries = Object.entries(COUNTRY_LABELS).filter(([code, { label }]) => {
    if (!countrySearch) return true
    return label.includes(countrySearch) || code.toLowerCase().includes(countrySearch.toLowerCase())
  })

  const selectedCountry = COUNTRY_LABELS[draft.countryCode]
  const selectedCountryLabel = selectedCountry ? `${selectedCountry.emoji} ${selectedCountry.label}` : ""
  const countryInputValue = showCountryList ? countrySearch : (countrySearch || selectedCountryLabel)
  const serverRegionsLabel = getServerRegionsLabel(profileSummary.serverRegions)

  return (
    <div className={`profile-overlay${isOpen ? " active" : ""}`}>
      <div className="profile-overlay-topbar">
        <button
          type="button"
          className="profile-overlay-logo"
          onClick={onGoHome}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        >
          unface
        </button>
        <button className="profile-close-btn" onClick={() => { setEditMode(false); onClose() }}>✕</button>
      </div>

      <div className="profile-overlay-body">
        {editMode ? (
          <>
            <div className="po-header">
              <div className="po-pic">{profileAvatar}</div>
              <div className="po-name">{nickname}</div>
              <div className="po-tag">내 정보 변경</div>
            </div>

            <div className="po-cards">
              {/* 내 정보 카드 */}
              <div className="po-card">
                <div className="po-card-label">내 정보</div>

                {/* 국가 (검색 가능) */}
                <div className="po-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                  <span className="po-key">국가</span>
                  <div style={{ position: "relative", width: "100%" }}>
                    <input
                      type="text"
                      value={countryInputValue}
                      name="country-search"
                      placeholder="국가 검색..."
                      onChange={(e) => { setCountrySearch(e.target.value); setShowCountryList(true) }}
                      onFocus={() => { setCountrySearch(""); setShowCountryList(true) }}
                      onBlur={() => setTimeout(() => { setShowCountryList(false); setCountrySearch("") }, 150)}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      style={selectStyle}
                    />
                    {showCountryList && (
                      <div style={{
                        position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
                        maxHeight: 200, overflowY: "auto",
                        background: "var(--glass-menu-bg)", border: "1px solid var(--glass-card-border)",
                        borderRadius: 10, boxShadow: "0 18px 40px rgba(0,0,0,0.2)",
                        backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
                      }}>
                        {filteredCountries.length === 0 ? (
                          <div style={{ padding: "8px 10px", fontSize: 13, color: "var(--text-dim)" }}>검색 결과 없음</div>
                        ) : filteredCountries.map(([code, { emoji, label }]) => (
                          <div
                            key={code}
                            onMouseDown={() => { setDraft((d) => ({ ...d, countryCode: code })); setCountrySearch(""); setShowCountryList(false) }}
                            style={{
                              padding: "7px 10px", fontSize: 13, cursor: "pointer",
                              background: draft.countryCode === code ? "#7c3aed" : "transparent",
                              color: draft.countryCode === code ? "#fff" : "var(--text-primary)",
                            }}
                          >
                            {emoji} {label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 언어 */}
                <div className="po-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6, marginTop: 12 }}>
                  <span className="po-key">언어</span>
                  <select
                    value={draft.language}
                    onChange={(e) => setDraft((d) => ({ ...d, language: e.target.value }))}
                    style={selectStyle}
                  >
                    {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* 성별 */}
                <div className="po-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6, marginTop: 12 }}>
                  <span className="po-key">성별</span>
                  <div className="po-choice-group">
                    {genderOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, gender: opt.value }))}
                        className={`po-choice-pill${draft.gender === opt.value ? " active" : ""}`}
                      >
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 매칭 범위 카드 */}
              <div className="po-card">
                <div className="po-card-label">매칭 범위</div>

                {/* 서버 대륙 (다중 선택) */}
                <div className="po-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span className="po-key">서버 대륙</span>
                    <span className="po-choice-hint">복수 선택 가능</span>
                  </div>
                  <div className="po-choice-group">
                    {CONTINENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => toggleContinent(opt.code)}
                        className={`po-choice-pill${draft.serverRegions.includes(opt.code) ? " active" : ""}`}
                      >
                        <span className="po-choice-icon">{opt.emoji}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 선호 성별 */}
                <div className="po-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6, marginTop: 12 }}>
                  <span className="po-key">선호 성별</span>
                  <div className="po-choice-group">
                    {genderOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, preferGender: opt.value }))}
                        className={`po-choice-pill${draft.preferGender === opt.value ? " active" : ""}`}
                      >
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="po-action-row">
              <button
                type="button"
                className="po-action-btn po-action-btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "저장 중..." : "저장"}
              </button>
              <button
                type="button"
                className="po-action-btn"
                onClick={() => setEditMode(false)}
              >
                취소
              </button>
            </div>
          </>
        ) : (
          <>
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
                  <span className="po-key">서버 대륙</span>
                  <span className="po-val">{serverRegionsLabel}</span>
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

            <button className="po-edit-btn" onClick={openEdit}>
              내 정보 변경 →
            </button>
          </>
        )}
      </div>
    </div>
  )
}
