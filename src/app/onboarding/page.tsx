"use client"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"

const REGIONS = ["북아메리카", "남아메리카", "유럽", "아프리카", "아시아", "오세아니아"] as const
const REGION_EMOJI: Record<string, string> = {
  "북아메리카": "🌎", "남아메리카": "🌎", "유럽": "🌍", "아프리카": "🌍", "아시아": "🌏", "오세아니아": "🌏"
}

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [theme, setTheme] = useState("dark")
  const [step, setStep] = useState(1)
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set())
  const [gender, setGender] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [regionError, setRegionError] = useState(false)
  const [genderError, setGenderError] = useState(false)
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 })
  const mapWrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("unface-theme") || "dark"
    setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("unface-theme", theme)
  }, [theme])

  // 비로그인 시 /login으로 리다이렉트
  useEffect(() => {
    if (session === null) router.push("/login")
  }, [session, router])

  // 온보딩 이미 완료한 사용자는 /main으로 바로 이동
  useEffect(() => {
    if (!session) return
    fetch("/api/users/me").then(r => r.json()).then(me => {
      if (me?.gender && me?.countryCode) router.push("/main")
    }).catch(() => {})
  }, [session, router])


  const toggleRegion = (r: string) => {
    setSelectedRegions(prev => {
      const next = new Set(prev)
      if (next.has(r)) next.delete(r)
      else next.add(r)
      return next
    })
    setRegionError(false)
  }

  const finish = async () => {
    if (!gender) {
      setGenderError(true)
      return
    }
    setSubmitting(true)
    const regionToCode: Record<string, string> = {
      "북아메리카": "NA",
      "남아메리카": "SA",
      "유럽": "EU",
      "아프리카": "AF",
      "아시아": "AS",
      "오세아니아": "OC",
    }
    const rawRegion = selectedRegions.size > 0 ? [...selectedRegions][0] : "아시아"
    const countryCode = regionToCode[rawRegion] || "AS"
    const genderMap: Record<string, string> = { "남성": "MALE", "여성": "FEMALE", "상관없음": "OTHER" }
    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gender: genderMap[gender ?? "상관없음"] ?? "OTHER", countryCode }),
    })
    setSubmitting(false)
    if (res.ok) {
      router.push("/main")
    } else {
      alert("설정 저장에 실패했어요. 다시 시도해주세요.")
    }
  }

  const progress = (step / 2) * 100

  return (
    <>
      <style>{`
        :root[data-theme="dark"] {
          --text-primary:#ffffff; --text-sub:rgba(255,255,255,0.52); --text-dim:rgba(255,255,255,0.28);
          --body-bg:#080810; --card-bg:rgba(255,255,255,0.04); --card-border:rgba(255,255,255,0.10);
          --card-hover:rgba(255,255,255,0.08); --card-selected:rgba(124,58,237,0.18); --card-sel-border:rgba(124,58,237,0.7);
          --toggle-bg:rgba(255,255,255,0.08); --toggle-border:rgba(255,255,255,0.15); --btn-hover:rgba(255,255,255,0.12);
          --progress-bg:rgba(255,255,255,0.10); --map-land:rgba(255,255,255,0.12); --map-hover:rgba(167,139,250,0.45);
          --map-selected:rgba(124,58,237,0.85); --map-stroke:rgba(255,255,255,0.06); --map-bg:rgba(255,255,255,0.03);
          --glow:radial-gradient(ellipse 60% 55% at 50% 45%,rgba(124,58,237,0.12) 0%,transparent 70%);
        }
        :root[data-theme="light"] {
          --text-primary:#0f0f1a; --text-sub:rgba(15,15,26,0.50); --text-dim:rgba(15,15,26,0.30);
          --body-bg:#f8f7ff; --card-bg:rgba(15,15,26,0.03); --card-border:rgba(15,15,26,0.09);
          --card-hover:rgba(15,15,26,0.06); --card-selected:rgba(124,58,237,0.10); --card-sel-border:rgba(124,58,237,0.60);
          --toggle-bg:rgba(15,15,26,0.05); --toggle-border:rgba(15,15,26,0.10); --btn-hover:rgba(15,15,26,0.08);
          --progress-bg:rgba(15,15,26,0.10); --map-land:rgba(15,15,26,0.13); --map-hover:rgba(124,58,237,0.30);
          --map-selected:rgba(124,58,237,0.75); --map-stroke:rgba(15,15,26,0.05); --map-bg:rgba(15,15,26,0.02);
          --glow:radial-gradient(ellipse 60% 55% at 50% 45%,rgba(124,58,237,0.07) 0%,transparent 70%);
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{min-height:100vh;font-family:'Noto Sans KR',sans-serif;background:var(--body-bg);color:var(--text-primary);transition:background 0.4s,color 0.4s}
        .page{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:100px 24px 60px;position:relative}
        .page::before{content:'';position:fixed;inset:0;background:var(--glow);pointer-events:none;transition:background 0.4s}
        .top-bar{position:fixed;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:24px 40px;z-index:100}
        .logo{font-family:'Outfit',sans-serif;font-weight:800;font-size:20px;color:var(--text-primary);cursor:pointer;letter-spacing:-0.5px;transition:opacity 0.2s,color 0.4s}
        .logo:hover{opacity:0.6}
        .theme-toggle{width:40px;height:40px;border-radius:9px;border:1px solid var(--toggle-border);background:var(--toggle-bg);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;backdrop-filter:blur(12px);transition:background 0.25s,transform 0.15s}
        .theme-toggle:hover{transform:scale(1.07);background:var(--btn-hover)}
        .progress-wrap{position:fixed;top:80px;left:50%;transform:translateX(-50%);width:100%;max-width:480px;padding:0 40px;z-index:100}
        .progress-bar{height:3px;background:var(--progress-bg);border-radius:99px;overflow:hidden}
        .progress-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#7c3aed,#06b6d4);transition:width 0.5s cubic-bezier(0.4,0,0.2,1)}
        .progress-label{margin-top:8px;font-size:11.5px;color:var(--text-dim);text-align:right;font-weight:500}
        .step-cont{position:relative;z-index:1;width:100%;max-width:540px;display:flex;flex-direction:column;gap:28px;animation:fadeUp 0.38s cubic-bezier(0.4,0,0.2,1)}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .step-header{display:flex;flex-direction:column;gap:6px}
        .step-q{font-size:24px;font-weight:900;letter-spacing:-1px;line-height:1.25}
        .gradient-text{background:linear-gradient(135deg,#a78bfa,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .step-hint{font-size:14px;color:var(--text-sub);line-height:1.6}
        .map-wrap{background:var(--map-bg);border:1px solid var(--card-border);border-radius:20px;padding:20px 16px 16px;transition:background 0.4s,border-color 0.4s}
        #world-svg{width:100%;height:auto;display:block}
        .continent{fill:var(--map-land);stroke:var(--map-stroke);stroke-width:0.8;cursor:pointer;transition:fill 0.2s}
        .continent:hover{fill:var(--map-hover)}
        .continent.selected{fill:var(--map-selected);stroke:rgba(167,139,250,0.9);stroke-width:1.5;filter:drop-shadow(0 0 6px rgba(124,58,237,0.5))}
        .map-tooltip{position:absolute;pointer-events:none;padding:6px 12px;border-radius:8px;background:rgba(20,16,40,0.92);border:1px solid rgba(167,139,250,0.35);color:#e9d5ff;font-size:12.5px;font-weight:700;letter-spacing:-0.2px;white-space:nowrap;opacity:0;transform:translateY(4px);transition:opacity 0.15s,transform 0.15s;z-index:50;box-shadow:0 4px 16px rgba(0,0,0,0.3);display:flex;align-items:center;gap:6px}
        [data-theme="light"] .map-tooltip{background:rgba(255,255,255,0.96);border-color:rgba(124,58,237,0.3);color:#4c1d95;box-shadow:0 4px 16px rgba(124,58,237,0.15)}
        .map-tooltip.visible{opacity:1;transform:translateY(0)}
        .tooltip-dot{width:6px;height:6px;border-radius:50%;background:#a78bfa;flex-shrink:0}
        .region-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;min-height:32px}
        .region-tag{display:flex;align-items:center;gap:6px;padding:5px 12px;border-radius:99px;background:var(--card-selected);border:1px solid var(--card-sel-border);font-size:12.5px;font-weight:600;color:#a78bfa}
        .tag-remove{cursor:pointer;font-size:13px;opacity:0.6}
        .tag-remove:hover{opacity:1}
        .map-tip{font-size:12px;color:var(--text-dim);text-align:center;margin-top:4px}
        .step-error{font-size:12px;color:#f87171;text-align:center;margin-top:6px;font-weight:600}
        .gender-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .gender-card{position:relative;padding:24px 12px 20px;border-radius:18px;border:1px solid var(--card-border);background:var(--card-bg);display:flex;flex-direction:column;align-items:center;gap:12px;cursor:pointer;transition:background 0.2s,border-color 0.2s,transform 0.2s;user-select:none}
        .gender-card:hover{background:var(--card-hover);transform:translateY(-2px)}
        .gender-card.selected{background:var(--card-selected);border-color:var(--card-sel-border);transform:translateY(-2px)}
        .gender-card.selected::after{content:'✓';position:absolute;top:10px;right:12px;font-size:12px;color:#a78bfa;font-weight:700}
        .gender-icon{width:64px;height:64px}
        .gender-label{font-size:14px;font-weight:700;letter-spacing:-0.3px}
        .gender-sub{font-size:11.5px;color:var(--text-dim)}
        .step-footer{display:flex;align-items:center;justify-content:space-between}
        .btn-back{background:none;border:none;font-size:13px;color:var(--text-dim);cursor:pointer;font-family:'Noto Sans KR',sans-serif;padding:0;transition:color 0.2s}
        .btn-back:hover{color:var(--text-sub)}
        .btn-next{padding:13px 28px;border-radius:13px;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;font-size:14.5px;font-weight:700;border:none;cursor:pointer;font-family:'Noto Sans KR',sans-serif;box-shadow:0 4px 20px rgba(124,58,237,0.35);transition:opacity 0.2s,transform 0.15s}
        .btn-next:hover:not(:disabled){opacity:0.88;transform:translateY(-2px)}
        .btn-next:disabled{opacity:0.35;cursor:not-allowed;box-shadow:none}
        @media(max-width:480px){.top-bar{padding:20px 24px}.progress-wrap{padding:0 24px}.gender-grid{gap:8px}.gender-icon{width:52px;height:52px}}
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet" />

      <div className="top-bar">
        <span className="logo">unface</span>
        <button className="theme-toggle" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
          {theme === "dark" ? "🌙" : "☀️"}
        </button>
      </div>

      <div className="progress-wrap">
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        <div className="progress-label">{step} / 2</div>
      </div>

      <div className="page page-transition">
        {/* 스텝 1: 지역 */}
        {step === 1 && (
          <div className="step-cont">
            <div className="step-header">
              <h1 className="step-q">어느 <span className="gradient-text">지역</span>과<br />연결될까요?</h1>
              <p className="step-hint">복수 선택 가능해요. 지도에서 원하는 지역을 눌러보세요.</p>
            </div>
            <div className="map-wrap" style={{ position: "relative" }} ref={mapWrapRef}>
              <div className={`map-tooltip${tooltip.visible ? " visible" : ""}`} style={{ left: tooltip.x, top: tooltip.y }}>
                <span className="tooltip-dot" />
                <span>{tooltip.text}</span>
              </div>
              <svg id="world-svg" viewBox="0 0 900 440" xmlns="http://www.w3.org/2000/svg">
                <rect width="900" height="440" fill="transparent"/>
                <path
                  className={`continent${selectedRegions.has("북아메리카") ? " selected" : ""}`}
                  data-region="북아메리카"
                  onMouseEnter={() => setTooltip(t => ({ ...t, visible: true, text: "북아메리카 🌎" }))}
                  onMouseMove={e => {
                    const rect = mapWrapRef.current?.getBoundingClientRect()
                    if (!rect) return
                    let x = e.clientX - rect.left + 12
                    let y = e.clientY - rect.top - 38
                    const tw = 120
                    if (x + tw > rect.width - 8) x = e.clientX - rect.left - tw - 8
                    setTooltip(t => ({ ...t, x, y }))
                  }}
                  onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
                  onClick={() => toggleRegion("북아메리카")}
                  d="M 95,55 L 175,45 L 220,55 L 245,80 L 255,110 L 240,145 L 210,165 L 190,195 L 170,215 L 145,220 L 120,210 L 100,185 L 85,155 L 75,120 L 80,85 Z"
                />
                <path
                  className={`continent${selectedRegions.has("남아메리카") ? " selected" : ""}`}
                  data-region="남아메리카"
                  onMouseEnter={() => setTooltip(t => ({ ...t, visible: true, text: "남아메리카 🌎" }))}
                  onMouseMove={e => {
                    const rect = mapWrapRef.current?.getBoundingClientRect()
                    if (!rect) return
                    let x = e.clientX - rect.left + 12
                    let y = e.clientY - rect.top - 38
                    const tw = 120
                    if (x + tw > rect.width - 8) x = e.clientX - rect.left - tw - 8
                    setTooltip(t => ({ ...t, x, y }))
                  }}
                  onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
                  onClick={() => toggleRegion("남아메리카")}
                  d="M 175,245 L 215,235 L 240,250 L 248,280 L 245,320 L 230,355 L 210,385 L 185,400 L 165,390 L 150,360 L 148,325 L 155,290 L 162,265 Z"
                />
                <path
                  className={`continent${selectedRegions.has("유럽") ? " selected" : ""}`}
                  data-region="유럽"
                  onMouseEnter={() => setTooltip(t => ({ ...t, visible: true, text: "유럽 🌍" }))}
                  onMouseMove={e => {
                    const rect = mapWrapRef.current?.getBoundingClientRect()
                    if (!rect) return
                    let x = e.clientX - rect.left + 12
                    let y = e.clientY - rect.top - 38
                    const tw = 120
                    if (x + tw > rect.width - 8) x = e.clientX - rect.left - tw - 8
                    setTooltip(t => ({ ...t, x, y }))
                  }}
                  onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
                  onClick={() => toggleRegion("유럽")}
                  d="M 390,45 L 435,40 L 460,55 L 470,80 L 455,105 L 435,118 L 415,125 L 395,115 L 375,100 L 370,75 L 380,58 Z"
                />
                <path
                  className={`continent${selectedRegions.has("아프리카") ? " selected" : ""}`}
                  data-region="아프리카"
                  onMouseEnter={() => setTooltip(t => ({ ...t, visible: true, text: "아프리카 🌍" }))}
                  onMouseMove={e => {
                    const rect = mapWrapRef.current?.getBoundingClientRect()
                    if (!rect) return
                    let x = e.clientX - rect.left + 12
                    let y = e.clientY - rect.top - 38
                    const tw = 120
                    if (x + tw > rect.width - 8) x = e.clientX - rect.left - tw - 8
                    setTooltip(t => ({ ...t, x, y }))
                  }}
                  onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
                  onClick={() => toggleRegion("아프리카")}
                  d="M 395,135 L 440,128 L 468,140 L 478,170 L 480,210 L 475,255 L 460,295 L 440,330 L 415,345 L 390,335 L 372,305 L 365,270 L 368,230 L 372,190 L 375,158 Z"
                />
                <path
                  className={`continent${selectedRegions.has("아시아") ? " selected" : ""}`}
                  data-region="아시아"
                  onMouseEnter={() => setTooltip(t => ({ ...t, visible: true, text: "아시아 🌏" }))}
                  onMouseMove={e => {
                    const rect = mapWrapRef.current?.getBoundingClientRect()
                    if (!rect) return
                    let x = e.clientX - rect.left + 12
                    let y = e.clientY - rect.top - 38
                    const tw = 120
                    if (x + tw > rect.width - 8) x = e.clientX - rect.left - tw - 8
                    setTooltip(t => ({ ...t, x, y }))
                  }}
                  onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
                  onClick={() => toggleRegion("아시아")}
                  d="M 480,40 L 570,35 L 640,45 L 700,60 L 730,90 L 740,125 L 720,155 L 690,170 L 650,175 L 610,165 L 575,170 L 545,160 L 515,145 L 490,125 L 475,100 L 472,72 Z"
                />
                <path
                  className={`continent${selectedRegions.has("오세아니아") ? " selected" : ""}`}
                  data-region="오세아니아"
                  onMouseEnter={() => setTooltip(t => ({ ...t, visible: true, text: "오세아니아 🌏" }))}
                  onMouseMove={e => {
                    const rect = mapWrapRef.current?.getBoundingClientRect()
                    if (!rect) return
                    let x = e.clientX - rect.left + 12
                    let y = e.clientY - rect.top - 38
                    const tw = 120
                    if (x + tw > rect.width - 8) x = e.clientX - rect.left - tw - 8
                    setTooltip(t => ({ ...t, x, y }))
                  }}
                  onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
                  onClick={() => toggleRegion("오세아니아")}
                  d="M 640,265 L 700,255 L 745,268 L 760,295 L 755,325 L 730,342 L 695,345 L 660,335 L 640,310 L 635,285 Z"
                />
                <path fill="var(--map-land)" opacity="0.4" stroke="var(--map-stroke)" strokeWidth="0.5" d="M 195,18 L 230,14 L 255,22 L 260,38 L 245,48 L 220,50 L 200,42 L 190,30 Z"/>
                <ellipse cx="710" cy="130" rx="12" ry="8" fill="var(--map-land)" opacity="0.5"/>
                <ellipse cx="685" cy="210" rx="18" ry="9" fill="var(--map-land)" opacity="0.4"/>
                <ellipse cx="388" cy="68" rx="7" ry="10" fill="var(--map-land)" opacity="0.5"/>
                <ellipse cx="775" cy="330" rx="8" ry="14" fill="var(--map-land)" opacity="0.45"/>
                <ellipse cx="495" cy="295" rx="7" ry="16" fill="var(--map-land)" opacity="0.45"/>
                <ellipse cx="580" cy="178" rx="5" ry="7" fill="var(--map-land)" opacity="0.4"/>
                <line x1="0" y1="220" x2="900" y2="220" stroke="var(--map-stroke)" strokeWidth="0.5" strokeDasharray="4,6"/>
                <line x1="0" y1="110" x2="900" y2="110" stroke="var(--map-stroke)" strokeWidth="0.3" strokeDasharray="3,8"/>
                <line x1="0" y1="330" x2="900" y2="330" stroke="var(--map-stroke)" strokeWidth="0.3" strokeDasharray="3,8"/>
              </svg>
              <div className="region-tags">
                {selectedRegions.size === 0
                  ? <span style={{ fontSize: 12, color: "var(--text-dim)", padding: "5px 0" }}>지도를 클릭해 지역을 선택하세요</span>
                  : [...selectedRegions].map(r => (
                    <span key={r} className="region-tag">
                      {REGION_EMOJI[r]} {r}
                      <span className="tag-remove" onClick={() => toggleRegion(r)}>✕</span>
                    </span>
                  ))
                }
              </div>
              <p className="map-tip">전체 선택 시 랜덤 매칭</p>
              {regionError && <div className="step-error">지역을 선택하지 않아서 다음으로 넘어갈 수 없어요.</div>}
            </div>
            <div className="step-footer">
              <button className="btn-back" onClick={() => router.push("/login")}>← 로그인으로</button>
              <button
                className="btn-next"
                onClick={() => {
                  if (selectedRegions.size === 0) {
                    setRegionError(true)
                    return
                  }
                  setStep(2)
                }}
              >
                다음 →
              </button>
            </div>
          </div>
        )}

        {/* 스텝 2: 성별 */}
        {step === 2 && (
          <div className="step-cont">
            <div className="step-header">
              <h1 className="step-q">나는 <span className="gradient-text">어떤 사람</span>인가요?</h1>
              <p className="step-hint">매칭에 사용돼요. 익명성은 변하지 않아요.</p>
            </div>
            <div className="gender-grid">
              {[
                { key: "남성", label: "남성", sub: "Male", icon: (
                  <svg className="gender-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="32" cy="22" r="13" fill="#7c3aed" opacity="0.25"/>
                    <circle cx="32" cy="22" r="11" fill="#a78bfa" opacity="0.6"/>
                    <ellipse cx="27" cy="21" rx="2" ry="2.5" fill="#0f0f1a" opacity="0.7"/>
                    <ellipse cx="37" cy="21" rx="2" ry="2.5" fill="#0f0f1a" opacity="0.7"/>
                    <line x1="24" y1="17" x2="30" y2="17" stroke="#0f0f1a" strokeWidth="1.8" strokeLinecap="round" opacity="0.6"/>
                    <line x1="34" y1="17" x2="40" y2="17" stroke="#0f0f1a" strokeWidth="1.8" strokeLinecap="round" opacity="0.6"/>
                    <path d="M 27 28 Q 32 31 37 28" stroke="#0f0f1a" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
                    <path d="M 18 52 Q 18 40 32 40 Q 46 40 46 52" fill="#7c3aed" opacity="0.35"/>
                    <path d="M 14 44 Q 18 40 32 40 Q 46 40 50 44" stroke="#a78bfa" strokeWidth="2" fill="none" opacity="0.5"/>
                  </svg>
                )},
                { key: "여성", label: "여성", sub: "Female", icon: (
                  <svg className="gender-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="32" cy="20" rx="14" ry="16" fill="#22d3ee" opacity="0.2"/>
                    <circle cx="32" cy="22" r="11" fill="#06b6d4" opacity="0.55"/>
                    <ellipse cx="27.5" cy="21" rx="2" ry="2.5" fill="#0f0f1a" opacity="0.7"/>
                    <ellipse cx="36.5" cy="21" rx="2" ry="2.5" fill="#0f0f1a" opacity="0.7"/>
                    <path d="M 28.5 28 Q 32 30.5 35.5 28" stroke="#0f0f1a" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
                    <ellipse cx="24" cy="26" rx="3.5" ry="2" fill="#f472b6" opacity="0.35"/>
                    <ellipse cx="40" cy="26" rx="3.5" ry="2" fill="#f472b6" opacity="0.35"/>
                    <path d="M 20 52 Q 22 40 32 39 Q 42 40 44 52" fill="#06b6d4" opacity="0.30"/>
                  </svg>
                )},
                { key: "상관없음", label: "상관없음", sub: "Any", icon: (
                  <svg className="gender-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#22d3ee"/></linearGradient></defs>
                    <circle cx="32" cy="28" r="14" fill="url(#rg)" opacity="0.3"/>
                    <path d="M 26 24 Q 26 18 32 18 Q 38 18 38 24 Q 38 29 32 30 L 32 35" stroke="url(#rg)" strokeWidth="3" fill="none" strokeLinecap="round"/>
                    <circle cx="32" cy="40" r="2.2" fill="url(#rg)"/>
                  </svg>
                )},
              ].map(({ key, label, sub, icon }) => (
                <div
                  key={key}
                  className={`gender-card${gender === key ? " selected" : ""}`}
                  onClick={() => {
                    setGender(key)
                    setGenderError(false)
                  }}
                >
                  {icon}
                  <span className="gender-label">{label}</span>
                  <span className="gender-sub">{sub}</span>
                </div>
              ))}
            </div>
            {genderError && <div className="step-error">선택하지 않아서 다음으로 넘어갈 수 없어요.</div>}
            <div className="step-footer">
              <button className="btn-back" onClick={() => setStep(1)}>← 이전</button>
              <button className="btn-next" disabled={submitting} onClick={finish}>
                {submitting ? "저장 중..." : "시작하기 →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
