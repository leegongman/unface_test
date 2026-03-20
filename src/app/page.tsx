"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const router = useRouter()
  const [theme, setThemeState] = useState("dark")
  const [liveCount, setLiveCount] = useState(3241)

  useEffect(() => {
    const saved = localStorage.getItem("unface-theme") || "dark"
    setThemeState(saved)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("unface-theme", theme)
  }, [theme])

  useEffect(() => {
    let baseCount = 3241
    function randomFluctuate() {
      const delta = Math.floor(Math.random() * 9) - 3
      baseCount = Math.max(3000, baseCount + delta)
      setLiveCount(baseCount)
      const next = 2000 + Math.random() * 3000
      setTimeout(randomFluctuate, next)
    }
    const t = setTimeout(randomFluctuate, 3000)
    return () => clearTimeout(t)
  }, [])

  function handleStart() { router.push("/login?force=1") }
  function handleDemo() { router.push("/login") }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet" />
      <style>{`
    /* ─── CSS 변수 ─── */
    :root[data-theme="dark"] {
      --text-primary:   #ffffff;
      --text-sub:       rgba(255,255,255,0.70);
      --text-tag:       rgba(255,255,255,0.42);
      --btn-glass:      rgba(255,255,255,0.10);
      --btn-border:     rgba(255,255,255,0.20);
      --btn-hover:      rgba(255,255,255,0.17);
      --badge-bg:       rgba(52,211,153,0.15);
      --badge-border:   rgba(52,211,153,0.35);
      --badge-dot:      #34d399;
      --badge-text:     #6ee7b7;
      --toggle-bg:      rgba(255,255,255,0.09);
      --toggle-border:  rgba(255,255,255,0.18);
      /* 히어로 배경: 다크 네이비 그라데이션 */
      --hero-bg:        radial-gradient(ellipse at 70% 50%, #1a0a3a 0%, #0a0a18 55%, #080810 100%);
      /* 이미지 위 왼쪽 오버레이 — 텍스트 가독성 */
      --hero-overlay:   linear-gradient(95deg, #080810 0%, #080810 38%, rgba(8,8,16,0.7) 58%, transparent 100%);
      --section-bg:     #09090f;
      --section-border: rgba(255,255,255,0.07);
      --feature-bg:     rgba(255,255,255,0.04);
      --feature-border: rgba(255,255,255,0.09);
      --body-bg:        #080810;
    }
    :root[data-theme="light"] {
      --text-primary:   #0f0f1a;
      --text-sub:       rgba(15,15,26,0.58);
      --text-tag:       rgba(15,15,26,0.38);
      --btn-glass:      rgba(15,15,26,0.06);
      --btn-border:     rgba(15,15,26,0.12);
      --btn-hover:      rgba(15,15,26,0.10);
      --badge-bg:       rgba(5,150,105,0.10);
      --badge-border:   rgba(5,150,105,0.28);
      --badge-dot:      #059669;
      --badge-text:     #047857;
      --toggle-bg:      rgba(15,15,26,0.06);
      --toggle-border:  rgba(15,15,26,0.10);
      --hero-bg:        linear-gradient(135deg, #f8f7ff 0%, #eeeaff 40%, #e0f2fe 100%);
      --hero-overlay:   linear-gradient(95deg, #f8f7ff 0%, #f8f7ff 36%, rgba(248,247,255,0.75) 55%, transparent 100%);
      --section-bg:     #ffffff;
      --section-border: rgba(15,15,26,0.06);
      --feature-bg:     rgba(15,15,26,0.025);
      --feature-border: rgba(15,15,26,0.07);
      --body-bg:        #f8f7ff;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Noto Sans KR', sans-serif;
      background: var(--body-bg);
      color: var(--text-primary);
      overflow-x: hidden;
      transition: background 0.4s, color 0.4s;
    }

    /* ─── 네비게이션 ─── */
    nav {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 22px 52px;
    }
    .logo {
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 22px;
      color: var(--text-primary);
      cursor: pointer;
      letter-spacing: -0.5px;
      transition: opacity 0.2s, color 0.4s;
    }
    .logo:hover { opacity: 0.65; }
    .theme-toggle {
      width: 44px; height: 44px;
      border-radius: 10px;
      border: 1px solid var(--toggle-border);
      background: var(--toggle-bg);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      font-size: 18px;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      transition: background 0.25s, transform 0.15s, border-color 0.4s;
    }
    .theme-toggle:hover { transform: scale(1.06); background: var(--btn-hover); }
    .theme-toggle:active { transform: scale(0.94); }

    /* ─── 히어로 ─── */
    .hero {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      background: var(--hero-bg);
      overflow: hidden;
      transition: background 0.4s;
    }

    /* 캐릭터 이미지 — 절대위치 img 태그로 화질 보존 */
    .hero-img {
      position: absolute;
      right: -2%;
      bottom: 0;
      width: 56%;
      max-width: 760px;
      height: 100%;
      object-fit: contain;
      object-position: right bottom;
      /* 화질 보존 */
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      pointer-events: none;
      transition: filter 0.4s;
    }
    [data-theme="dark"] .hero-img {
      filter: drop-shadow(0 0 60px rgba(124,58,237,0.3)) brightness(1.05);
    }
    [data-theme="light"] .hero-img {
      filter: drop-shadow(0 12px 40px rgba(124,58,237,0.18)) brightness(1.02) saturate(0.95);
    }

    /* 왼쪽 그라데이션 오버레이 — 텍스트 가독성 */
    .hero-overlay {
      position: absolute;
      inset: 0;
      background: var(--hero-overlay);
      pointer-events: none;
      transition: background 0.4s;
    }

    /* 하단 페이드 */
    .hero-fade {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 140px;
      background: linear-gradient(to top, var(--body-bg), transparent);
      pointer-events: none;
      transition: background 0.4s;
    }

    /* 텍스트 콘텐츠 */
    .hero-content {
      position: relative;
      z-index: 10;
      padding: 0 52px;
      max-width: 580px;
      margin-top: 60px;
      display: flex;
      flex-direction: column;
      gap: 26px;
    }

    /* ─── 뱃지 (접속자 수) ─── */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 14px;
      border-radius: 100px;
      background: var(--badge-bg);
      border: 1px solid var(--badge-border);
      color: var(--badge-text);
      font-size: 12.5px;
      font-weight: 600;
      width: fit-content;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      transition: background 0.4s, border-color 0.4s, color 0.4s;
    }
    .badge-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--badge-dot);
      box-shadow: 0 0 6px var(--badge-dot);
      animation: pulse-green 2s infinite;
      flex-shrink: 0;
      transition: background 0.4s, box-shadow 0.4s;
    }
    @keyframes pulse-green {
      0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 6px var(--badge-dot); }
      50% { opacity: 0.5; transform: scale(0.82); box-shadow: 0 0 2px var(--badge-dot); }
    }
    .badge-count {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 13px;
    }

    /* 헤드라인 */
    .headline {
      font-size: clamp(40px, 5vw, 64px);
      font-weight: 900;
      line-height: 1.15;
      letter-spacing: -2px;
      color: var(--text-primary);
      transition: color 0.4s;
    }
    .gradient-text {
      background: linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* 서브카피 */
    .subtext {
      font-size: 16px;
      color: var(--text-sub);
      line-height: 1.72;
      max-width: 400px;
      transition: color 0.4s;
    }

    /* CTA 그룹 */
    .cta-group {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .btn-primary {
      padding: 15px 30px;
      border-radius: 14px;
      background: linear-gradient(135deg, #7c3aed, #06b6d4);
      color: #fff;
      font-size: 15px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      font-family: 'Noto Sans KR', sans-serif;
      box-shadow: 0 6px 28px rgba(124,58,237,0.38);
      transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
      letter-spacing: -0.2px;
    }
    .btn-primary:hover {
      opacity: 0.88;
      transform: translateY(-2px);
      box-shadow: 0 10px 36px rgba(124,58,237,0.5);
    }
    .btn-primary:active { transform: translateY(0); }
    .btn-glass {
      padding: 15px 24px;
      border-radius: 14px;
      background: var(--btn-glass);
      border: 1px solid var(--btn-border);
      color: var(--text-primary);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      font-family: 'Noto Sans KR', sans-serif;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      transition: background 0.2s, transform 0.15s, color 0.4s, border-color 0.4s;
    }
    .btn-glass:hover { background: var(--btn-hover); transform: translateY(-1px); }
    .btn-glass:active { transform: translateY(0); }

    /* 소셜 힌트 */
    .social-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-tag);
      font-size: 12.5px;
      transition: color 0.4s;
    }
    .social-chips { display: flex; gap: 4px; }
    .chip {
      width: 24px; height: 24px;
      border-radius: 7px;
      background: var(--btn-glass);
      border: 1px solid var(--btn-border);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px;
      backdrop-filter: blur(8px);
    }

    /* ─── 피처 섹션 ─── */
    .features-wrap {
      background: var(--section-bg);
      border-top: 1px solid var(--section-border);
      transition: background 0.4s, border-color 0.4s;
    }
    .features {
      max-width: 1060px;
      margin: 0 auto;
      padding: 72px 48px;
    }
    .section-label {
      text-align: center;
      color: var(--text-tag);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      margin-bottom: 12px;
      transition: color 0.4s;
    }
    .section-title {
      text-align: center;
      font-size: clamp(22px, 3vw, 30px);
      font-weight: 800;
      letter-spacing: -0.8px;
      margin-bottom: 44px;
      transition: color 0.4s;
    }
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }
    .feature-card {
      padding: 28px 24px;
      border-radius: 18px;
      background: var(--feature-bg);
      border: 1px solid var(--feature-border);
      transition: background 0.2s, transform 0.2s, border-color 0.4s;
      cursor: default;
    }
    .feature-card:hover {
      background: var(--btn-glass);
      transform: translateY(-3px);
    }
    /* 아이콘 없음 — 타이틀 바로 */
    .f-name {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 10px;
      letter-spacing: -0.3px;
      transition: color 0.4s;
    }
    .f-desc {
      font-size: 13.5px;
      color: var(--text-sub);
      line-height: 1.68;
      transition: color 0.4s;
    }

    /* ─── 스탯 ─── */
    .stats-wrap {
      background: var(--section-bg);
      border-top: 1px solid var(--section-border);
      border-bottom: 1px solid var(--section-border);
      transition: background 0.4s, border-color 0.4s;
    }
    .stats {
      max-width: 860px;
      margin: 0 auto;
      padding: 60px 48px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      text-align: center;
    }
    .stat-num {
      font-family: 'Outfit', sans-serif;
      font-size: clamp(32px, 4vw, 46px);
      font-weight: 800;
      background: linear-gradient(135deg, #7c3aed, #06b6d4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -1.5px;
    }
    .stat-lbl {
      font-size: 13px;
      color: var(--text-sub);
      margin-top: 6px;
      font-weight: 500;
      transition: color 0.4s;
    }

    /* ─── 최종 CTA ─── */
    .final-cta {
      background: var(--section-bg);
      padding: 80px 48px 110px;
      text-align: center;
      transition: background 0.4s;
    }
    .final-title {
      font-size: clamp(24px, 3.5vw, 40px);
      font-weight: 900;
      letter-spacing: -1.5px;
      margin-bottom: 14px;
      transition: color 0.4s;
    }
    .final-sub {
      font-size: 15px;
      color: var(--text-sub);
      margin-bottom: 36px;
      transition: color 0.4s;
    }
    .final-cta .btn-primary { font-size: 16px; padding: 16px 38px; }

    /* ─── 반응형 ─── */
    @media (max-width: 768px) {
      nav { padding: 18px 24px; }
      .hero-content { padding: 0 24px; max-width: 100%; }
      .hero-img { width: 80%; right: -10%; opacity: 0.4; }
      .hero-overlay {
        background: linear-gradient(180deg, var(--body-bg) 0%, rgba(8,8,16,0.55) 100%);
      }
      .features, .stats, .final-cta { padding-left: 24px; padding-right: 24px; }
      .feature-grid { grid-template-columns: 1fr; }
    }
      `}</style>
      <div className="page-transition">

      {/* 네비게이션 */}
      <nav>
        <span className="logo">unface</span>
        <button className="theme-toggle" id="themeToggle" aria-label="테마 전환" onClick={() => setThemeState(t => t === "dark" ? "light" : "dark")}>{theme === "dark" ? "🌙" : "☀️"}</button>
      </nav>

      {/* 히어로 섹션 */}
      <section className="hero">
        {/* 캐릭터 이미지: img 태그로 원본 화질 유지 */}
        <img
          className="hero-img"
          src=""
          alt="unface 캐릭터"
        />
        {/* 왼쪽 텍스트 보호 오버레이 */}
        <div className="hero-overlay"></div>
        {/* 하단 페이드 */}
        <div className="hero-fade"></div>

        {/* 텍스트 */}
        <div className="hero-content">
          <span className="badge">
            <span className="badge-dot"></span>
            <span className="badge-count" id="liveCount">{liveCount.toLocaleString("ko-KR")}명</span>이 지금 접속 중
          </span>

          <h1 className="headline">
            가면을 써도<br />
            <span className="gradient-text">괜찮아</span>
          </h1>

          <p className="subtext">
            익명으로 연결되는 랜덤 영상통화, unface<br />
            얼굴을 숨기고 세계 어딘가의 누군가와 대화하세요.
          </p>

          <div className="cta-group">
            <button className="btn-primary" onClick={handleStart}>나를 숨기고 시작하기 →</button>
            <button className="btn-glass" onClick={handleDemo}>미리 보기</button>
          </div>

          <div className="social-hint">
            <div className="social-chips">
              <div className="chip">G</div>
              <div className="chip">📷</div>
              <div className="chip">✈️</div>
            </div>
            소셜 계정으로 3초 가입 · 완전 무료
          </div>
        </div>
      </section>

      {/* 핵심 기능 */}
      <div className="features-wrap">
        <div className="features">
          <p className="section-label">Features</p>
          <h2 className="section-title">나를 완벽히 숨겨드릴게요</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <p className="f-name">얼굴 아바타</p>
              <p className="f-desc">동물, 캐릭터, 커스텀 가면으로 얼굴을 완전히 바꿔보세요. AI가 실시간으로 변환합니다.</p>
            </div>
            <div className="feature-card">
              <p className="f-name">음성 변조</p>
              <p className="f-desc">목소리까지 바꿔서 완벽한 익명성을 보장합니다. 남성↔여성, 로봇, 아이 등 다양한 옵션.</p>
            </div>
            <div className="feature-card">
              <p className="f-name">실시간 번역</p>
              <p className="f-desc">언어가 달라도 괜찮아요. AI 자막과 자동번역으로 전 세계 누구와도 자연스럽게 대화하세요.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 신뢰 지표 */}
      <div className="stats-wrap">
        <div className="stats">
          <div>
            <p className="stat-num">2.4M+</p>
            <p className="stat-lbl">전 세계 사용자</p>
          </div>
          <div>
            <p className="stat-num">180+</p>
            <p className="stat-lbl">연결된 국가</p>
          </div>
          <div>
            <p className="stat-num">99.9%</p>
            <p className="stat-lbl">익명 보호율</p>
          </div>
        </div>
      </div>

      {/* 최종 CTA */}
      <div className="final-cta">
        <h2 className="final-title">오늘 밤, 아무도 모르는 나로</h2>
        <p className="final-sub">가입은 무료 · 가면은 필수 · 연결은 즉시</p>
        <button className="btn-primary" onClick={handleStart}>무료로 시작하기 →</button>
      </div>
      </div>
    </>
  )
}
