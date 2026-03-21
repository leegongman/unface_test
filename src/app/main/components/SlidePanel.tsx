// 파일 경로: src/app/main/components/SlidePanel.tsx
import { AVATARS, CELEBS, VOICES } from "../constants"
import type { ActivePanel, AvatarTab, VoiceTab } from "../types"

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

interface SlidePanelProps {
  activePanel: ActivePanel
  avatarTab: AvatarTab
  onSetAvatarTab: (tab: AvatarTab) => void
  voiceTab: VoiceTab
  onSetVoiceTab: (tab: VoiceTab) => void
  selectedAvatar: number
  onSelectAvatar: (index: number) => void | Promise<void>
  selectedCeleb: number | null
  onSelectCeleb: (index: number) => void | Promise<void>
  selectedVoice: number
  onSelectVoice: (index: number) => void
  selectedTranslate: number
  onSelectTranslate: (index: number) => void
  ownedAvatarNames: Set<string>
  onOpenPayment: (item: PaymentItem) => void
}

export function SlidePanel({
  activePanel,
  avatarTab,
  onSetAvatarTab,
  voiceTab,
  onSetVoiceTab,
  selectedAvatar,
  onSelectAvatar,
  selectedCeleb,
  onSelectCeleb,
  selectedVoice,
  onSelectVoice,
  selectedTranslate,
  onSelectTranslate,
  ownedAvatarNames,
  onOpenPayment,
}: SlidePanelProps) {
  return (
    <div className={`slide-panel${activePanel ? " open" : ""}`}>
      <div className="panel-inner">
        {activePanel === "avatar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <p className="panel-title"><span className="gradient-text">아바타</span></p>
            <div className="avatar-tab-bar">
              {(["basic", "celeb", "rpg"] as AvatarTab[]).map((tab, index) => (
                <button key={tab} className={`avatar-tab${avatarTab === tab ? " active" : ""}`} onClick={() => onSetAvatarTab(tab)}>
                  {["캐릭터", "셀럽 AI", "RPG"][index]}
                </button>
              ))}
            </div>
            {avatarTab === "basic" && (
              <div className="avatar-grid">
                {AVATARS.map((avatar, index) => (
                  <div
                    key={index}
                    className={`avatar-card${selectedAvatar === index ? " selected" : ""}`}
                    onClick={() => void onSelectAvatar(index)}
                  >
                    <span className="avatar-emoji">{avatar.emoji}</span>
                    <span className="avatar-name">{avatar.name}</span>
                    <span className={`avatar-price${avatar.free ? " free" : ""}`}>
                      {ownedAvatarNames.has(avatar.name) ? "보유" : avatar.price}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {avatarTab === "celeb" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="celeb-notice">🤖 셀럽 AI 변환은 선택 후 결제하면 바로 사용할 수 있어요.</div>
                <div className="celeb-grid">
                  {CELEBS.map((celeb, index) => (
                    <div
                      key={index}
                      className={`celeb-card${selectedCeleb === index ? " selected" : ""}`}
                      onClick={() => void onSelectCeleb(index)}
                    >
                      <div className="celeb-face" style={{ background: celeb.grad }}>{celeb.face}</div>
                      <span className="celeb-name">{celeb.name}<br /><span className="celeb-group">{celeb.group}</span></span>
                      <span className="celeb-price">{ownedAvatarNames.has(celeb.name) ? "보유" : celeb.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {avatarTab === "rpg" && (
              <div className="rpg-lock-banner">
                <div style={{ fontSize: 28 }}>⚔️</div>
                <div className="rpg-lock-title">Pro 이상 전용 기능이에요</div>
                <div className="rpg-lock-desc">RPG 캐릭터 커스터마이징은<br />Pro · Max · Pro Max 플랜에서만 사용할 수 있어요.</div>
                <button className="rpg-lock-btn" onClick={() => onOpenPayment({ name: "Pro 플랜", type: "구독 · 월간 결제", price: "$1", thumb: "✦", priceValue: 1, itemType: "plan", refName: "Pro", planName: "Pro" })}>플랜 업그레이드 →</button>
              </div>
            )}
          </div>
        )}

        {activePanel === "voice" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p className="panel-title"><span className="gradient-text">음성</span></p>
            <div className="avatar-tab-bar">
              {(["morph", "ai"] as VoiceTab[]).map((tab, index) => (
                <button key={tab} className={`avatar-tab${voiceTab === tab ? " active" : ""}`} onClick={() => onSetVoiceTab(tab)}>
                  {["목소리 변조", "AI 보이스"][index]}
                </button>
              ))}
            </div>
            {voiceTab === "morph" && (
              <div className="voice-list">
                {VOICES.map((voice, index) => (
                  <div key={index} className={`voice-card${selectedVoice === index ? " selected" : ""}`} onClick={() => onSelectVoice(index)}>
                    <div className="voice-dot">{voice.dot}</div>
                    <div style={{ flex: 1 }}>
                      <div className="voice-name">{voice.name}</div>
                      <div className="voice-desc">{voice.desc}</div>
                    </div>
                    <span className="voice-check">✓</span>
                  </div>
                ))}
              </div>
            )}
            {voiceTab === "ai" && (
              <div className="plan-tip">
                <span>Pro 플랜</span> 전용 기능이에요.<br />AI 보이스는 엔터테인먼트 목적으로만 사용 가능해요.
              </div>
            )}
          </div>
        )}

        {activePanel === "translate" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p className="panel-title"><span className="gradient-text">번역</span></p>
            <div className="t-list">
              {[
                { icon: "💬", label: "AI 자막", desc: "화면 하단에 번역 자막을 실시간으로 표시해요. 빠르고 가벼워요." },
                { icon: "🚫", label: "번역 끄기", desc: "번역 기능을 사용하지 않아요." },
              ].map((translate, index) => (
                <div key={index} className={`t-card${selectedTranslate === index ? " selected" : ""}`} onClick={() => onSelectTranslate(index)}>
                  <div className="t-top">
                    <div className="t-title">{translate.icon} {translate.label}</div>
                    <div className="radio"><div className="radio-dot" /></div>
                  </div>
                  <div className="t-desc">{translate.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
