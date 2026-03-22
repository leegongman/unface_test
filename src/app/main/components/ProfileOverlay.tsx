// 파일 경로: src/app/main/components/ProfileOverlay.tsx
import { useState } from "react"
import type { CSSProperties } from "react"

import { CONTINENT_LABELS, COUNTRY_LABELS, GENDER_LABELS, LANGUAGE_LABELS, getLocationLabel, getServerRegionsLabel } from "../constants"
import type { ProfileSummary } from "../types"

interface ProfileOverlayProps {
  isOpen: boolean
  onClose: () => void
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
    border: "1px solid var(--card-border)",
    background: "var(--card-bg)",
    color: "var(--text-primary)",
    fontSize: 13,
  }

  const genderBtnStyle = (active: boolean): CSSProperties => ({
    padding: "5px 14px",
    borderRadius: 20,
    fontSize: 12,
    cursor: "pointer",
    border: "1px solid var(--card-border)",
    background: active ? "var(--accent)" : "var(--card-bg)",
    color: active ? "#fff" : "var(--text-primary)",
  })

  const continentBtnStyle = (active: boolean): CSSProperties => ({
    padding: "5px 12px",
    borderRadius: 20,
    fontSize: 12,
    cursor: "pointer",
    border: "1px solid var(--card-border)",
    background: active ? "#7c3aed" : "var(--card-bg)",
    color: active ? "#fff" : "var(--text-primary)",
  })

  const filteredCountries = Object.entries(COUNTRY_LABELS).filter(([code, { label }]) => {
    if (!countrySearch) return true
    return label.includes(countrySearch) || code.toLowerCase().includes(countrySearch.toLowerCase())
  })

  const selectedCountry = COUNTRY_LABELS[draft.countryCode]
  const serverRegionsLabel = getServerRegionsLabel(profileSummary.serverRegions)

  return (
    <div className={`profile-overlay${isOpen ? " active" : ""}`}>
      <div className="profile-overlay-topbar">
        <span className="profile-overlay-logo">unface</span>
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
                      value={countrySearch}
                      placeholder={selectedCountry ? `${selectedCountry.emoji} ${selectedCountry.label}` : "국가 검색..."}
                      onChange={(e) => { setCountrySearch(e.target.value); setShowCountryList(true) }}
                      onFocus={() => setShowCountryList(true)}
                      onBlur={() => setTimeout(() => setShowCountryList(false), 150)}
                      style={selectStyle}
                    />
                    {showCountryList && (
                      <div style={{
                        position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
                        maxHeight: 200, overflowY: "auto",
                        background: "var(--card-bg)", border: "1px solid var(--card-border)",
                        borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
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
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {genderOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, gender: opt.value }))}
                        style={genderBtnStyle(draft.gender === opt.value)}
                      >{opt.label}</button>
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
                    <span style={{ fontSize: 11, color: "var(--text-dim)" }}>복수 선택 가능</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {CONTINENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => toggleContinent(opt.code)}
                        style={continentBtnStyle(draft.serverRegions.includes(opt.code))}
                      >{opt.emoji} {opt.label}</button>
                    ))}
                  </div>
                </div>

                {/* 선호 성별 */}
                <div className="po-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6, marginTop: 12 }}>
                  <span className="po-key">선호 성별</span>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {genderOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, preferGender: opt.value }))}
                        style={genderBtnStyle(draft.preferGender === opt.value)}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                className="po-edit-btn"
                onClick={handleSave}
                disabled={saving}
                style={{ flex: 1, background: "#7c3aed", color: "#fff" }}
              >
                {saving ? "저장 중..." : "저장하기 →"}
              </button>
              <button
                className="po-edit-btn"
                onClick={() => setEditMode(false)}
                style={{ flex: 1, background: "var(--card-bg)", color: "var(--text-sub)" }}
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
