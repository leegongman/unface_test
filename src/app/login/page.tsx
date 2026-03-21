// 변경 이유: Next.js 16 빌드에서 useSearchParams 사용 시 Suspense 경계가 필요해 로그인 페이지 래퍼를 추가했습니다.
"use client"
import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, useSession } from "next-auth/react"

type View = "v-login" | "v-signup" | "v-forgot1" | "v-forgot2" | "v-forgot3" | "v-forgot4"

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [theme, setThemeState] = useState("dark")
  const [view, setView] = useState<View>("v-login")

  // login form
  const [lEmail, setLEmail] = useState("")
  const [lPw, setLPw] = useState("")
  const [lPwShow, setLPwShow] = useState(false)
  const [remember, setRemember] = useState(false)
  const [lEmailErr, setLEmailErr] = useState(false)
  const [lPwErr, setLPwErr] = useState(false)

  // signup form
  const [sNick, setSNick] = useState("")
  const [sEmail, setSEmail] = useState("")
  const [sPw, setSPw] = useState("")
  const [sPwCf, setSPwCf] = useState("")
  const [sPwShow, setSPwShow] = useState(false)
  const [sPwCfShow, setSPwCfShow] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [pwStrength, setPwStrength] = useState(0)
  const [sNickErr, setSNickErr] = useState(false)
  const [sEmailErr, setSEmailErr] = useState(false)
  const [sPwErr, setSPwErr] = useState(false)
  const [sPwCfErr, setSPwCfErr] = useState(false)
  const [sAgreeErr, setSAgreeErr] = useState(false)

  // login / signup 에러 메시지
  const [lLoginErr, setLLoginErr] = useState("")
  const [sSignupErr, setSSignupErr] = useState("")
  const [oauthNotice, setOauthNotice] = useState("")

  // forgot password
  const [fEmail, setFEmail] = useState("")
  const [fCode, setFCode] = useState("")
  const [fNewPw, setFNewPw] = useState("")
  const [fNewPwCf, setFNewPwCf] = useState("")
  const [fNewPwShow, setFNewPwShow] = useState(false)
  const [fNewPwCfShow, setFNewPwCfShow] = useState(false)
  const [fEmailErr, setFEmailErr] = useState(false)
  const [fCodeErr, setFCodeErr] = useState(false)
  const [fNewPwErr, setFNewPwErr] = useState(false)
  const [fNewPwCfErr, setFNewPwCfErr] = useState(false)
  const [timerSec, setTimerSec] = useState(180)
  const [timerDone, setTimerDone] = useState(false)
  const [fCodeSub, setFCodeSub] = useState("이메일로 6자리 코드를 전송했어요.")
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const force = searchParams.get("force")
    if (force === "1") return
    if (session?.user) {
      fetch("/api/users/me")
        .then(r => r.json())
        .then(me => {
          if (me?.gender && me?.countryCode) {
            router.push("/main")
          } else {
            router.push("/onboarding")
          }
        })
        .catch(() => router.push("/onboarding"))
    }
  }, [session, router, searchParams])

  useEffect(() => {
    const saved = localStorage.getItem("unface-theme") || "dark"
    setThemeState(saved)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("unface-theme", theme)
  }, [theme])

  function isEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }

  function show(id: View) { setView(id) }
  function goHome() { router.push("/") }
  function goNext() { router.push("/onboarding") }
  function getGoogleCallbackUrl() {
    if (typeof window === "undefined") return "/api/auth/redirect"
    return new URL("/api/auth/redirect", window.location.origin).toString()
  }
  function isPrivateIpHost(hostname: string) {
    return /^(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)$/.test(hostname)
  }
  function getGoogleOAuthNotice() {
    if (typeof window === "undefined") return ""
    const { protocol, hostname } = window.location
    const normalizedHost = hostname.toLowerCase()
    const isLocalhost =
      normalizedHost === "localhost" ||
      normalizedHost === "127.0.0.1" ||
      normalizedHost === "::1" ||
      normalizedHost === "[::1]"

    if (isLocalhost) return ""
    if (isPrivateIpHost(normalizedHost)) {
      return "Google 로그인은 사설 IP 주소(예: 192.168.x.x)에서 차단돼요. 휴대폰 테스트는 HTTPS 도메인 또는 터널 주소가 필요해요."
    }
    if (protocol !== "https:") {
      return "Google 로그인은 HTTPS 주소에서만 안정적으로 동작해요. localhost가 아니라면 HTTPS 도메인으로 접속해주세요."
    }
    return ""
  }
  function startGoogleSignIn() {
    const notice = getGoogleOAuthNotice()
    setOauthNotice(notice)
    if (notice) return
    void signIn("google", { callbackUrl: getGoogleCallbackUrl() })
  }

  async function doLogin() {
    const e = lEmail.trim()
    const p = lPw
    setLEmailErr(!isEmail(e))
    setLPwErr(p.length === 0)
    setLLoginErr("")
    if (!isEmail(e) || p.length === 0) return
    const res = await signIn("credentials", { email: e, password: p, redirect: false })
    if (res?.ok) {
      const meRes = await fetch("/api/users/me")
      const me = await meRes.json()
      if (me?.gender && me?.countryCode) {
        router.push("/main")
      } else {
        router.push("/onboarding")
      }
    }
    else { setLLoginErr("이메일 또는 비밀번호가 올바르지 않아요.") }
  }

  async function doSignup() {
    const n = sNick.trim(), e = sEmail.trim(), p = sPw, pc = sPwCf
    setSNickErr(n.length < 2)
    setSEmailErr(!isEmail(e))
    setSPwErr(p.length < 8)
    setSPwCfErr(p !== pc)
    setSAgreeErr(!agreed)
    setSSignupErr("")
    if (n.length < 2 || !isEmail(e) || p.length < 8 || p !== pc || !agreed) return
    try {
      const apiRes = await fetch("/api/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nickname: n, email: e, password: p }) })
      if (!apiRes.ok) {
        setSSignupErr("이미 사용 중인 이메일이에요.")
        return
      }
      const signRes = await signIn("credentials", { email: e, password: p, redirect: false })
      if (!signRes?.ok) {
        setSSignupErr("회원가입은 됐지만 로그인에 실패했어요. 다시 로그인해주세요.")
        show("v-login")
        return
      }
    } catch {
      setSSignupErr("오류가 발생했어요. 다시 시도해주세요.")
      return
    }
    router.push("/onboarding")
  }

  function computeStrength(v: string) {
    if (!v) { setPwStrength(0); return }
    let sc = 0
    if (v.length >= 8) sc++
    if (/[A-Za-z]/.test(v) && /[0-9]/.test(v)) sc++
    if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) sc++
    setPwStrength(sc)
  }

  function startTimer() {
    let left = 180
    setTimerSec(180)
    setTimerDone(false)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      left--
      setTimerSec(left)
      if (left <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        setTimerDone(true)
      }
    }, 1000)
  }

  function sendCode() {
    const e = fEmail.trim()
    setFEmailErr(!isEmail(e))
    if (!isEmail(e)) return
    setFCodeSub(e + "로 코드를 전송했어요.")
    show("v-forgot2")
    startTimer()
  }

  function verifyCode() {
    setFCodeErr(fCode !== "123456")
    if (fCode !== "123456") return
    if (timerRef.current) clearInterval(timerRef.current)
    show("v-forgot3")
  }

  async function resetPw() {
    const p = fNewPw, pc = fNewPwCf
    setFNewPwErr(p.length < 8)
    setFNewPwCfErr(p !== pc)
    if (p.length < 8 || p !== pc) return
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: fEmail, password: p }),
    })
    if (res.ok) {
      show("v-forgot4")
    } else {
      setFNewPwErr(true)
    }
  }

  const strengthLevels = ["weak", "medium", "strong"]
  const strengthTexts = ["취약", "보통", "강함"]
  const strengthLevel = pwStrength > 0 ? strengthLevels[pwStrength - 1] : ""
  const strengthText = pwStrength > 0 ? strengthTexts[pwStrength - 1] : ""

  const timerMin = Math.floor(timerSec / 60)
  const timerS = String(timerSec % 60).padStart(2, "0")
  const timerDisplay = timerDone ? "만료됨" : `${timerMin}:${timerS}`

  const EYE_OPEN = (
    <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  )
  const EYE_OFF = (
    <svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  )

  return (
    <>
      <style>{`
    :root[data-theme="dark"]{
      --text-primary:#ffffff; --text-sub:rgba(255,255,255,0.52); --text-dim:rgba(255,255,255,0.28);
      --body-bg:#080810; --card-bg:rgba(255,255,255,0.04); --card-border:rgba(255,255,255,0.10);
      --card-hover:rgba(255,255,255,0.08); --toggle-bg:rgba(255,255,255,0.08);
      --toggle-border:rgba(255,255,255,0.15); --input-bg:rgba(255,255,255,0.05);
      --divider:rgba(255,255,255,0.10);
      --glow:radial-gradient(ellipse 60% 55% at 50% 45%,rgba(124,58,237,0.13) 0%,transparent 70%);
    }
    :root[data-theme="light"]{
      --text-primary:#0f0f1a; --text-sub:rgba(15,15,26,0.50); --text-dim:rgba(15,15,26,0.30);
      --body-bg:#f8f7ff; --card-bg:rgba(15,15,26,0.03); --card-border:rgba(15,15,26,0.09);
      --card-hover:rgba(15,15,26,0.06); --toggle-bg:rgba(15,15,26,0.05);
      --toggle-border:rgba(15,15,26,0.10); --input-bg:rgba(15,15,26,0.04);
      --divider:rgba(15,15,26,0.10);
      --glow:radial-gradient(ellipse 60% 55% at 50% 45%,rgba(124,58,237,0.07) 0%,transparent 70%);
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{font-family:'Noto Sans KR',sans-serif;background:var(--body-bg);color:var(--text-primary);transition:background 0.4s,color 0.4s}
    .page{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;padding:100px 24px 60px}
    .page::before{content:'';position:fixed;inset:0;background:var(--glow);pointer-events:none;transition:background 0.4s}
    .top-bar{position:fixed;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:24px 40px;z-index:100}
    .logo{font-family:'Outfit',sans-serif;font-weight:800;font-size:20px;color:var(--text-primary);cursor:pointer;letter-spacing:-0.5px;transition:opacity 0.2s}
    .logo:hover{opacity:0.6}
    .theme-toggle{width:40px;height:40px;border-radius:9px;border:1px solid var(--toggle-border);background:var(--toggle-bg);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;backdrop-filter:blur(12px);transition:background 0.25s,transform 0.15s}
    .theme-toggle:hover{transform:scale(1.07);background:var(--card-hover)}
    .theme-toggle:active{transform:scale(0.93)}

    /* 뷰 */
    .view{position:relative;z-index:1;width:100%;max-width:400px;display:none;flex-direction:column;gap:12px}
    .view.active{display:flex;animation:fadeUp 0.3s ease}
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

    .back-btn{display:inline-flex;align-items:center;gap:5px;font-size:13px;color:var(--text-dim);cursor:pointer;border:none;background:none;font-family:'Noto Sans KR',sans-serif;padding:0;margin-bottom:4px;transition:color 0.2s}
    .back-btn:hover{color:var(--text-sub)}
    .auth-title{font-size:26px;font-weight:900;letter-spacing:-1px;line-height:1.25;margin-bottom:2px;transition:color 0.4s}
    .gradient-text{background:linear-gradient(135deg,#a78bfa,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .auth-sub{font-size:13.5px;color:var(--text-sub);line-height:1.6;margin-bottom:4px;transition:color 0.4s}

    /* 단계 인디케이터 */
    .step-dots{display:flex;gap:6px;margin-bottom:4px}
    .step-dot{height:6px;border-radius:99px;background:var(--card-border);transition:background 0.3s,width 0.3s}
    .step-dot.active{background:#7c3aed;width:22px}
    .step-dot.done{background:rgba(124,58,237,0.4)}

    /* 입력 */
    .input-field{display:flex;flex-direction:column;gap:6px}
    .input-label{font-size:11.5px;font-weight:700;color:var(--text-dim);letter-spacing:0.3px;transition:color 0.4s}
    .input-wrap{position:relative}
    .auth-input{width:100%;padding:13px 16px;border-radius:13px;border:1px solid var(--card-border);background:var(--input-bg);color:var(--text-primary);font-size:14px;font-family:'Noto Sans KR',sans-serif;outline:none;transition:border-color 0.25s,background 0.2s,color 0.4s}
    .auth-input::placeholder{color:var(--text-dim)}
    .auth-input:focus{border-color:rgba(124,58,237,0.6);background:var(--card-hover)}
    .pw-toggle{position:absolute;right:14px;top:50%;transform:translateY(-50%);width:20px;height:20px;cursor:pointer;color:var(--text-dim);display:flex;align-items:center;justify-content:center;transition:color 0.2s}
    .pw-toggle:hover{color:var(--text-sub)}
    .pw-toggle svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .input-error{font-size:12px;color:#f87171;margin-top:-2px;display:none}
    .input-error.show{display:block}

    /* 비밀번호 강도 */
    .pw-strength{display:flex;gap:4px;margin-top:-2px}
    .pw-bar{flex:1;height:3px;border-radius:99px;background:var(--card-border);transition:background 0.3s}
    .pw-bar.weak{background:#f87171}
    .pw-bar.medium{background:#fbbf24}
    .pw-bar.strong{background:#34d399}
    .pw-lbl{font-size:11px;color:var(--text-dim);margin-top:-2px;transition:color 0.3s}
    .pw-lbl.weak{color:#f87171}.pw-lbl.medium{color:#fbbf24}.pw-lbl.strong{color:#34d399}

    /* 옵션 */
    .auth-options{display:flex;align-items:center;justify-content:space-between}
    .remember-wrap{display:flex;align-items:center;gap:7px;cursor:pointer;user-select:none}
    .remember-box{width:16px;height:16px;border-radius:5px;border:1.5px solid var(--card-border);background:var(--card-bg);display:flex;align-items:center;justify-content:center;font-size:10px;color:#a78bfa;transition:background 0.2s,border-color 0.2s;flex-shrink:0}
    .remember-label{font-size:12.5px;color:var(--text-sub);transition:color 0.4s}
    .text-btn{font-size:12.5px;color:var(--text-dim);cursor:pointer;border:none;background:none;font-family:'Noto Sans KR',sans-serif;padding:0;transition:color 0.2s;text-decoration:underline;text-underline-offset:2px}
    .text-btn:hover{color:var(--text-sub)}

    /* 약관 동의 */
    .agree-wrap{display:flex;align-items:flex-start;gap:9px;cursor:pointer;user-select:none}
    .agree-box{width:18px;height:18px;border-radius:5px;border:1.5px solid var(--card-border);background:var(--card-bg);display:flex;align-items:center;justify-content:center;font-size:11px;color:#a78bfa;flex-shrink:0;margin-top:1px;transition:background 0.2s,border-color 0.2s}
    .agree-text{font-size:12.5px;color:var(--text-sub);line-height:1.6;transition:color 0.4s}
    .agree-text a{color:#a78bfa;text-decoration:underline;text-underline-offset:2px;cursor:pointer}

    /* 인증코드 */
    .code-input{width:100%;padding:16px;border-radius:13px;border:1px solid var(--card-border);background:var(--input-bg);color:var(--text-primary);font-size:26px;font-family:'Outfit',sans-serif;font-weight:700;text-align:center;outline:none;letter-spacing:6px;transition:border-color 0.25s,background 0.2s}
    .code-input:focus{border-color:rgba(124,58,237,0.6);background:var(--card-hover)}
    .code-row{display:flex;align-items:center;justify-content:space-between}
    .timer{font-size:13px;color:#a78bfa;font-weight:700;font-family:'Outfit',sans-serif}

    /* 버튼 */
    .btn-primary{width:100%;padding:14px;border-radius:13px;border:none;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;box-shadow:0 4px 20px rgba(124,58,237,0.35);transition:opacity 0.2s,transform 0.15s}
    .btn-primary:hover{opacity:0.88;transform:translateY(-2px)}
    .btn-primary:active{transform:translateY(0)}
    .btn-secondary{width:100%;padding:13px;border-radius:13px;border:1px solid var(--card-border);background:var(--card-bg);color:var(--text-sub);font-size:14px;font-weight:600;cursor:pointer;font-family:'Noto Sans KR',sans-serif;transition:background 0.2s,color 0.2s}
    .btn-secondary:hover{background:var(--card-hover);color:var(--text-primary)}

    /* 전환 링크 */
    .switch-row{text-align:center;font-size:13px;color:var(--text-dim);transition:color 0.4s}
    .switch-link{color:#a78bfa;font-weight:700;cursor:pointer;text-decoration:underline;text-underline-offset:2px;transition:opacity 0.2s}
    .switch-link:hover{opacity:0.75}

    /* 구분선 */
    .divider-row{display:flex;align-items:center;gap:12px;margin:2px 0}
    .divider-line{flex:1;height:1px;background:var(--divider);transition:background 0.4s}
    .divider-label{font-size:12px;color:var(--text-dim);white-space:nowrap;font-weight:600;transition:color 0.4s}

    /* 간편 로그인 */
    .social-btn-row{display:flex;flex-direction:column;gap:8px}
    .social-login-btn{width:100%;padding:12px 16px;border-radius:13px;border:1px solid var(--card-border);background:var(--card-bg);display:flex;align-items:center;gap:12px;cursor:pointer;transition:background 0.2s,transform 0.15s}
    .social-login-btn:hover{background:var(--card-hover);transform:translateY(-1px)}
    .social-login-btn:active{transform:translateY(0)}
    .s-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .s-g{background:#fff}.s-i{background:linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)}.s-t{background:#229ED9}.s-x{background:#000}
    .s-label{font-size:13.5px;font-weight:600;color:var(--text-primary);flex:1;transition:color 0.4s}
    .s-arrow{font-size:14px;color:var(--text-dim);transition:color 0.2s,transform 0.2s}
    .social-login-btn:hover .s-arrow{color:var(--text-sub);transform:translateX(3px)}

    /* 완료 */
    .success-icon{font-size:52px;text-align:center}
    .success-msg{text-align:center;font-size:14px;color:var(--text-sub);line-height:1.7;transition:color 0.4s}

    .terms{font-size:11.5px;color:var(--text-dim);line-height:1.7;text-align:center;transition:color 0.4s}
    .terms a{color:var(--text-sub);text-decoration:underline;text-underline-offset:2px;cursor:pointer}
    .terms a:hover{color:var(--text-primary)}

    @media(max-width:480px){.top-bar{padding:20px 24px}}
      `}</style>

      <div className="page page-transition">
        <div className="top-bar">
          <span className="logo" onClick={goHome}>unface</span>
          <button className="theme-toggle" id="themeToggle" onClick={() => setThemeState(t => t === "dark" ? "light" : "dark")}>{theme === "dark" ? "🌙" : "☀️"}</button>
        </div>

        {/* ══ 로그인 ══ */}
        {view === "v-login" && (
          <div className="view active" id="v-login">
            <button className="back-btn" onClick={goHome}>← 홈으로</button>
            <h1 className="auth-title">가면 뒤에서<br /><span className="gradient-text">시작하기</span></h1>
            <p className="auth-sub">이메일과 비밀번호로 로그인하거나<br />간편 로그인을 이용해보세요.</p>

            <div className="input-field">
              <label className="input-label">이메일</label>
              <input className="auth-input" id="l-email" type="email" placeholder="example@email.com" value={lEmail} onChange={e => setLEmail(e.target.value)} onKeyDown={e => { if (e.key === "Enter") document.getElementById("l-pw")?.focus() }} />
              <span className={"input-error" + (lEmailErr ? " show" : "")}>올바른 이메일을 입력해주세요.</span>
            </div>
            <div className="input-field">
              <label className="input-label">비밀번호</label>
              <div className="input-wrap">
                <input className="auth-input" id="l-pw" type={lPwShow ? "text" : "password"} placeholder="비밀번호 입력" value={lPw} onChange={e => setLPw(e.target.value)} onKeyDown={e => { if (e.key === "Enter") doLogin() }} />
                <span className="pw-toggle" onClick={() => setLPwShow(v => !v)}>{lPwShow ? EYE_OFF : EYE_OPEN}</span>
              </div>
              <span className={"input-error" + (lPwErr ? " show" : "")}>비밀번호를 입력해주세요.</span>
            </div>

            <div className="auth-options">
              <div className="remember-wrap" onClick={() => setRemember(v => !v)}>
                <div className="remember-box" id="remBox" style={remember ? { background: "rgba(124,58,237,0.2)", borderColor: "rgba(124,58,237,0.6)" } : {}}>{remember ? "✓" : ""}</div>
                <span className="remember-label">로그인 유지</span>
              </div>
              <button className="text-btn" onClick={() => show("v-forgot1")}>비밀번호 찾기</button>
            </div>

            {lLoginErr && <span className="input-error show">{lLoginErr}</span>}
            <button className="btn-primary" onClick={doLogin}>로그인</button>
            <div className="switch-row">아직 계정이 없으신가요? <span className="switch-link" onClick={() => show("v-signup")}>회원가입</span></div>

            <div className="divider-row">
              <div className="divider-line"></div><span className="divider-label">간편 로그인</span><div className="divider-line"></div>
            </div>
            <div className="social-btn-row">
              <div className="social-login-btn" onClick={startGoogleSignIn}><div className="s-icon s-g"><svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.1 0 5.8 1.1 8 2.9l6-6C34.5 3.1 29.6 1 24 1 14.8 1 7 6.6 3.7 14.4l7 5.4C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7C43.7 37.4 46.5 31.4 46.5 24.5z"/><path fill="#FBBC05" d="M10.7 28.2A14.5 14.5 0 0 1 9.5 24c0-1.5.3-2.9.7-4.2l-7-5.4A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l8.2-6.6z"/><path fill="#34A853" d="M24 47c5.8 0 10.7-1.9 14.3-5.2l-7.4-5.7c-1.9 1.3-4.3 2-6.9 2-6.3 0-11.6-4.1-13.3-9.9l-8.2 6.6C7 41.4 14.8 47 24 47z"/></svg></div><span className="s-label">Google로 로그인</span><span className="s-arrow">›</span></div>
              <div className="social-login-btn" onClick={goNext}><div className="s-icon s-i"><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.975.975 1.246 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.975.975-2.242 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.975-.975-1.246-2.242-1.308-3.608C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.975-.975 2.242-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.014 7.052.072 5.197.157 3.355.673 1.924 2.104.493 3.535-.023 5.377.072 7.232c-.058 1.28-.072 1.689-.072 4.948s.014 3.668.072 4.948c.085 1.855.601 3.697 2.032 5.128 1.431 1.431 3.273 1.947 5.128 2.032 1.28.058 1.689.072 4.948.072s3.668-.014 4.948-.072c1.855-.085 3.697-.601 5.128-2.032 1.431-1.431 1.947-3.273 2.032-5.128.058-1.28.072-1.689.072-4.948s-.014-3.668-.072-4.948c-.085-1.855-.601-3.697-2.032-5.128C20.545.673 18.703.157 16.848.072 15.568.014 15.159 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg></div><span className="s-label">Instagram으로 로그인</span><span className="s-arrow">›</span></div>
              <div className="social-login-btn" onClick={goNext}><div className="s-icon s-t"><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg></div><span className="s-label">Telegram으로 로그인</span><span className="s-arrow">›</span></div>
              <div className="social-login-btn" onClick={goNext}><div className="s-icon s-x"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></div><span className="s-label">X로 로그인</span><span className="s-arrow">›</span></div>
            </div>
            {oauthNotice && <span className="input-error show">{oauthNotice}</span>}
            <p className="terms">계속 진행하면 unface의 <a>서비스 이용약관</a> 및 <a>개인정보 처리방침</a>에 동의하는 것으로 간주됩니다.</p>
          </div>
        )}

        {/* ══ 회원가입 ══ */}
        {view === "v-signup" && (
          <div className="view active" id="v-signup">
            <button className="back-btn" onClick={() => show("v-login")}>← 로그인으로</button>
            <h1 className="auth-title">지금 바로<br /><span className="gradient-text">함께하기</span></h1>
            <p className="auth-sub">계정을 만들고 익명의 세계로 들어오세요.</p>

            <div className="input-field">
              <label className="input-label">닉네임</label>
              <input className="auth-input" id="s-nick" type="text" placeholder="사용할 닉네임 (2~16자)" maxLength={16} value={sNick} onChange={e => setSNick(e.target.value)} />
              <span className={"input-error" + (sNickErr ? " show" : "")}>닉네임은 2자 이상이어야 해요.</span>
            </div>
            <div className="input-field">
              <label className="input-label">이메일</label>
              <input className="auth-input" id="s-email" type="email" placeholder="example@email.com" value={sEmail} onChange={e => setSEmail(e.target.value)} />
              <span className={"input-error" + (sEmailErr ? " show" : "")}>올바른 이메일을 입력해주세요.</span>
            </div>
            <div className="input-field">
              <label className="input-label">비밀번호</label>
              <div className="input-wrap">
                <input className="auth-input" id="s-pw" type={sPwShow ? "text" : "password"} placeholder="8자 이상 (영문+숫자 권장)" value={sPw} onChange={e => { setSPw(e.target.value); computeStrength(e.target.value) }} />
                <span className="pw-toggle" onClick={() => setSPwShow(v => !v)}>{sPwShow ? EYE_OFF : EYE_OPEN}</span>
              </div>
              <div className="pw-strength">
                <div className={"pw-bar" + (pwStrength >= 1 ? " " + strengthLevel : "")} id="sb1"></div>
                <div className={"pw-bar" + (pwStrength >= 2 ? " " + strengthLevel : "")} id="sb2"></div>
                <div className={"pw-bar" + (pwStrength >= 3 ? " " + strengthLevel : "")} id="sb3"></div>
              </div>
              <span className={"pw-lbl" + (strengthLevel ? " " + strengthLevel : "")} id="s-pwLbl">{strengthText}</span>
              <span className={"input-error" + (sPwErr ? " show" : "")}>비밀번호는 8자 이상이어야 해요.</span>
            </div>
            <div className="input-field">
              <label className="input-label">비밀번호 확인</label>
              <div className="input-wrap">
                <input className="auth-input" id="s-pwcf" type={sPwCfShow ? "text" : "password"} placeholder="비밀번호 재입력" value={sPwCf} onChange={e => setSPwCf(e.target.value)} onKeyDown={e => { if (e.key === "Enter") doSignup() }} />
                <span className="pw-toggle" onClick={() => setSPwCfShow(v => !v)}>{sPwCfShow ? EYE_OFF : EYE_OPEN}</span>
              </div>
              <span className={"input-error" + (sPwCfErr ? " show" : "")}>비밀번호가 일치하지 않아요.</span>
            </div>

            <div className="agree-wrap" onClick={() => setAgreed(v => !v)}>
              <div className="agree-box" id="agreeBox" style={agreed ? { background: "rgba(124,58,237,0.2)", borderColor: "rgba(124,58,237,0.6)" } : {}}>{agreed ? "✓" : ""}</div>
              <span className="agree-text"><a>서비스 이용약관</a> 및 <a>개인정보 처리방침</a>에 동의합니다. <span style={{ color: "var(--text-dim)" }}>(필수)</span></span>
            </div>
            <span className={"input-error" + (sAgreeErr ? " show" : "")}>약관에 동의해주세요.</span>

            {sSignupErr && <span className="input-error show">{sSignupErr}</span>}
            <button className="btn-primary" onClick={doSignup}>회원가입</button>
            <div className="switch-row">이미 계정이 있으신가요? <span className="switch-link" onClick={() => show("v-login")}>로그인</span></div>

            <div className="divider-row">
              <div className="divider-line"></div><span className="divider-label">간편 가입</span><div className="divider-line"></div>
            </div>
            <div className="social-btn-row">
              <div className="social-login-btn" onClick={startGoogleSignIn}><div className="s-icon s-g"><svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.1 0 5.8 1.1 8 2.9l6-6C34.5 3.1 29.6 1 24 1 14.8 1 7 6.6 3.7 14.4l7 5.4C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7C43.7 37.4 46.5 31.4 46.5 24.5z"/><path fill="#FBBC05" d="M10.7 28.2A14.5 14.5 0 0 1 9.5 24c0-1.5.3-2.9.7-4.2l-7-5.4A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l8.2-6.6z"/><path fill="#34A853" d="M24 47c5.8 0 10.7-1.9 14.3-5.2l-7.4-5.7c-1.9 1.3-4.3 2-6.9 2-6.3 0-11.6-4.1-13.3-9.9l-8.2 6.6C7 41.4 14.8 47 24 47z"/></svg></div><span className="s-label">Google로 가입</span><span className="s-arrow">›</span></div>
              <div className="social-login-btn" onClick={goNext}><div className="s-icon s-i"><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.975.975 1.246 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.975.975-2.242 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.975-.975-1.246-2.242-1.308-3.608C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.975-.975 2.242-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.014 7.052.072 5.197.157 3.355.673 1.924 2.104.493 3.535-.023 5.377.072 7.232c-.058 1.28-.072 1.689-.072 4.948s.014 3.668.072 4.948c.085 1.855.601 3.697 2.032 5.128 1.431 1.431 3.273 1.947 5.128 2.032 1.28.058 1.689.072 4.948.072s3.668-.014 4.948-.072c1.855-.085 3.697-.601 5.128-2.032 1.431-1.431 1.947-3.273 2.032-5.128.058-1.28.072-1.689.072-4.948s-.014-3.668-.072-4.948c-.085-1.855-.601-3.697-2.032-5.128C20.545.673 18.703.157 16.848.072 15.568.014 15.159 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg></div><span className="s-label">Instagram으로 가입</span><span className="s-arrow">›</span></div>
              <div className="social-login-btn" onClick={goNext}><div className="s-icon s-t"><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg></div><span className="s-label">Telegram으로 가입</span><span className="s-arrow">›</span></div>
              <div className="social-login-btn" onClick={goNext}><div className="s-icon s-x"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></div><span className="s-label">X로 가입</span><span className="s-arrow">›</span></div>
            </div>
            {oauthNotice && <span className="input-error show">{oauthNotice}</span>}
            <p className="terms">가입하면 unface의 <a>서비스 이용약관</a> 및 <a>개인정보 처리방침</a>에 동의하는 것으로 간주됩니다.</p>
          </div>
        )}

        {/* ══ 비밀번호 찾기 1: 이메일 ══ */}
        {view === "v-forgot1" && (
          <div className="view active" id="v-forgot1">
            <button className="back-btn" onClick={() => show("v-login")}>← 로그인으로</button>
            <div className="step-dots"><div className="step-dot active" id="fd1"></div><div className="step-dot" id="fd2"></div><div className="step-dot" id="fd3"></div></div>
            <h1 className="auth-title">비밀번호를<br /><span className="gradient-text">찾을게요</span></h1>
            <p className="auth-sub">가입한 이메일 주소를 입력해주세요.<br />인증 코드를 보내드릴게요.</p>
            <div className="input-field">
              <label className="input-label">이메일</label>
              <input className="auth-input" id="f-email" type="email" placeholder="example@email.com" value={fEmail} onChange={e => setFEmail(e.target.value)} />
              <span className={"input-error" + (fEmailErr ? " show" : "")}>올바른 이메일을 입력해주세요.</span>
            </div>
            <button className="btn-primary" onClick={sendCode}>인증 코드 보내기</button>
          </div>
        )}

        {/* ══ 비밀번호 찾기 2: 코드 ══ */}
        {view === "v-forgot2" && (
          <div className="view active" id="v-forgot2">
            <button className="back-btn" onClick={() => show("v-forgot1")}>← 이전</button>
            <div className="step-dots"><div className="step-dot done" id="fd1b"></div><div className="step-dot active" id="fd2b"></div><div className="step-dot" id="fd3b"></div></div>
            <h1 className="auth-title">코드를<br /><span className="gradient-text">입력해주세요</span></h1>
            <p className="auth-sub" id="f-codeSub">{fCodeSub}</p>
            <div className="input-field">
              <label className="input-label">인증 코드 (데모: 123456)</label>
              <input className="code-input" id="f-code" type="text" maxLength={6} placeholder="000000" value={fCode} onChange={e => setFCode(e.target.value.replace(/\D/g, ""))} />
              <span className={"input-error" + (fCodeErr ? " show" : "")}>코드가 올바르지 않아요.</span>
            </div>
            <div className="code-row">
              <span className="timer" id="f-timer">{timerDisplay}</span>
              <button className="text-btn" id="f-resend" onClick={() => { setFCode(""); startTimer() }} disabled={!timerDone}>재전송</button>
            </div>
            <button className="btn-primary" onClick={verifyCode}>확인</button>
          </div>
        )}

        {/* ══ 비밀번호 찾기 3: 새 비밀번호 ══ */}
        {view === "v-forgot3" && (
          <div className="view active" id="v-forgot3">
            <div className="step-dots"><div className="step-dot done"></div><div className="step-dot done"></div><div className="step-dot active"></div></div>
            <h1 className="auth-title">새 비밀번호를<br /><span className="gradient-text">설정할게요</span></h1>
            <p className="auth-sub">새로 사용할 비밀번호를 입력해주세요.</p>
            <div className="input-field">
              <label className="input-label">새 비밀번호</label>
              <div className="input-wrap">
                <input className="auth-input" id="f-newpw" type={fNewPwShow ? "text" : "password"} placeholder="8자 이상 입력" value={fNewPw} onChange={e => setFNewPw(e.target.value)} />
                <span className="pw-toggle" onClick={() => setFNewPwShow(v => !v)}>{fNewPwShow ? EYE_OFF : EYE_OPEN}</span>
              </div>
              <span className={"input-error" + (fNewPwErr ? " show" : "")}>비밀번호는 8자 이상이어야 해요.</span>
            </div>
            <div className="input-field">
              <label className="input-label">비밀번호 확인</label>
              <div className="input-wrap">
                <input className="auth-input" id="f-newpwcf" type={fNewPwCfShow ? "text" : "password"} placeholder="비밀번호 재입력" value={fNewPwCf} onChange={e => setFNewPwCf(e.target.value)} />
                <span className="pw-toggle" onClick={() => setFNewPwCfShow(v => !v)}>{fNewPwCfShow ? EYE_OFF : EYE_OPEN}</span>
              </div>
              <span className={"input-error" + (fNewPwCfErr ? " show" : "")}>비밀번호가 일치하지 않아요.</span>
            </div>
            <button className="btn-primary" onClick={resetPw}>비밀번호 변경</button>
          </div>
        )}

        {/* ══ 비밀번호 찾기 4: 완료 ══ */}
        {view === "v-forgot4" && (
          <div className="view active" id="v-forgot4">
            <div className="success-icon">🎉</div>
            <h1 className="auth-title" style={{ textAlign: "center" }}>비밀번호가<br /><span className="gradient-text">변경됐어요</span></h1>
            <p className="success-msg">새 비밀번호로 로그인해주세요.</p>
            <button className="btn-primary" onClick={() => show("v-login")}>로그인하러 가기</button>
          </div>
        )}

      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  )
}
