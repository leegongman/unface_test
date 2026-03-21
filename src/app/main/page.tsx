"use client"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { getSocket } from "@/lib/socket-client"

type ActivePanel = "avatar" | "voice" | "translate" | null
type ActiveTab = "recent" | "friends"
type AvatarTab = "basic" | "celeb" | "rpg"
type VoiceTab = "morph" | "ai"

const AVATARS = [
  { emoji: "😶", name: "기본", price: "$1", category: "MASK", free: true },
  { emoji: "🐱", name: "고양이", price: "$1", category: "ANIMAL" },
  { emoji: "🦊", name: "여우", price: "$1", category: "ANIMAL" },
  { emoji: "🤖", name: "로봇", price: "$1", category: "MASK" },
  { emoji: "🐙", name: "문어", price: "$1", category: "ANIMAL" },
  { emoji: "🦁", name: "사자", price: "$1", category: "ANIMAL" },
  { emoji: "👾", name: "에일리언", price: "$1", category: "MASK" },
  { emoji: "🎃", name: "호박", price: "$1", category: "MASK" },
  { emoji: "🧸", name: "곰인형", price: "$1", category: "ANIMAL" },
]

const CELEBS = [
  { name: "장원영", group: "아이브", price: "$1", face: "✦", grad: "linear-gradient(135deg,#fde68a,#f59e0b)" },
  { name: "뷔", group: "BTS", price: "$1", face: "✦", grad: "linear-gradient(135deg,#c4b5fd,#8b5cf6)" },
  { name: "카리나", group: "에스파", price: "$1", face: "✦", grad: "linear-gradient(135deg,#fbcfe8,#ec4899)" },
  { name: "차은우", group: "아스트로", price: "$1", face: "✦", grad: "linear-gradient(135deg,#a5f3fc,#06b6d4)" },
  { name: "윈터", group: "에스파", price: "$1", face: "✦", grad: "linear-gradient(135deg,#bbf7d0,#22c55e)" },
  { name: "지민", group: "BTS", price: "$1", face: "✦", grad: "linear-gradient(135deg,#fecaca,#ef4444)" },
]

const VOICES = [
  { dot: "🎙️", name: "원본", desc: "변조 없이 내 목소리 그대로" },
  { dot: "🔵", name: "낮은 목소리", desc: "남성적인 저음으로 변환" },
  { dot: "🩷", name: "높은 목소리", desc: "여성적인 고음으로 변환" },
  { dot: "🤖", name: "로봇", desc: "기계음으로 완전 변환" },
  { dot: "🧒", name: "어린이", desc: "귀엽고 높은 아이 목소리" },
]

export default function MainPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [theme, setTheme] = useState("dark")
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>("recent")
  const [tabOpen, setTabOpen] = useState(false)
  const [avatarTab, setAvatarTab] = useState<AvatarTab>("basic")
  const [voiceTab, setVoiceTab] = useState<VoiceTab>("morph")
  const [selectedAvatar, setSelectedAvatar] = useState(0)
  const [selectedVoice, setSelectedVoice] = useState(0)
  const [selectedTranslate, setSelectedTranslate] = useState(0)
  const [micOff, setMicOff] = useState(false)
  const [camOff, setCamOff] = useState(false)
  const [matching, setMatching] = useState(false)
  const [matchTimer, setMatchTimer] = useState(0)
  const [inCall, setInCall] = useState(false)
  const [callTimer, setCallTimer] = useState(0)
  const [credits, setCredits] = useState(0)
  const [chatMsg, setChatMsg] = useState("")
  const [messages, setMessages] = useState<Array<{ mine: boolean; text: string; time: string }>>([
    { mine: false, text: "안녕하세요! 👋", time: "오후 2:14" },
    { mine: true, text: "안녕하세요~ 반가워요!", time: "오후 2:14" },
  ])
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentItem, setPaymentItem] = useState({
    name: "고양이 아바타",
    type: "아바타",
    price: "$1",
    thumb: "🐱",
    priceValue: 1,
    itemType: "avatar",
    refName: "고양이",
    avatarCategory: "ANIMAL",
    creditAmount: 0,
    planName: "",
  })
  const [recentCalls, setRecentCalls] = useState<Array<{ id: string; name: string; meta: string; duration: string }>>([])
  const [friends, setFriends] = useState<Array<{ id: string; name: string; status: string; online: boolean; emoji: string; countryCode?: string; gender?: string }>>([])
  const [ownedAvatarNames, setOwnedAvatarNames] = useState<Set<string>>(new Set())
  const [avatarIdByName, setAvatarIdByName] = useState<Record<string, string>>({})
  const [activePeer, setActivePeer] = useState<{ id: string; name: string } | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [chatView, setChatView] = useState<{ emoji: string; name: string } | null>(null)
  const [payMethod, setPayMethod] = useState<"card" | "simple" | "virtual">("card")
  const [toast, setToast] = useState<string | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState("HARASSMENT")
  const [selectedCeleb, setSelectedCeleb] = useState<number | null>(null)

  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [friendRequest, setFriendRequest] = useState<{ fromSocketId: string; fromUserId: string; fromNickname: string } | null>(null)
  const [friendSubTab, setFriendSubTab] = useState<"list" | "received" | "sent">("list")
  const [receivedRequests, setReceivedRequests] = useState<Array<{ id: string; sender: { id: string; nickname: string } }>>([])
  const [sentRequests, setSentRequests] = useState<Array<{ id: string; receiver: { id: string; nickname: string } }>>([])

  // 사용자 프로필 (매칭에 사용)
  const [userProfile, setUserProfile] = useState<{ region: string; gender: string }>({ region: "아시아", gender: "OTHER" })
  const matchGenderPref = "OTHER" // 성별 필터 미사용 (전체 매칭)

  // Task 2: duplicate click prevention
  const [isMatchingLoading, setIsMatchingLoading] = useState(false)
  const [isAddFriendLoading, setIsAddFriendLoading] = useState(false)
  const [isReportLoading, setIsReportLoading] = useState(false)
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)

  // Task 9: toast type
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info")

  const matchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isMatchingRef = useRef(false) // 매칭 대기 중 여부 (stale 이벤트 방지용)
  const socketRef = useRef<any>(null)
  const activePeerSocketIdRef = useRef<string | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const iceCandidateBuffer = useRef<RTCIceCandidateInit[]>([])

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

  useEffect(() => {
    if (!session) return

    const loadAll = async () => {
      setLoadingProfile(true)
      try {
        const [meRes, avatarsRes, creditsRes, callsRes, friendsRes, reqsRes] = await Promise.all([
          fetch("/api/users/me", { cache: "no-store" }),
          fetch("/api/avatars", { cache: "no-store" }),
          fetch("/api/credits", { cache: "no-store" }),
          fetch("/api/calls/recent", { cache: "no-store" }),
          fetch("/api/friends", { cache: "no-store" }),
          fetch("/api/friends/requests", { cache: "no-store" }),
        ])

        if (avatarsRes.ok) {
          const data = await avatarsRes.json()
          const map: Record<string, string> = {}
          for (const a of data.avatars ?? []) {
            map[a.name] = a.id
          }
          setAvatarIdByName(map)
        }

        if (meRes.ok) {
          const me = await meRes.json()
          setUserProfile({ region: me.countryCode ?? "아시아", gender: me.gender ?? "OTHER" })
          setCredits(me.creditBalance ?? 0)
          const owned = new Set<string>()
          for (const ua of me.userAvatars ?? []) {
            if (ua.avatar?.name) owned.add(ua.avatar.name)
          }
          setOwnedAvatarNames(owned)
          if (me.equippedAvatar?.name) {
            const idx = AVATARS.findIndex(a => a.name === me.equippedAvatar.name)
            if (idx >= 0) setSelectedAvatar(idx)
          }
        }

        if (creditsRes.ok) {
          const credit = await creditsRes.json()
          setCredits(credit.balance ?? 0)
        }

        if (callsRes.ok) {
          const data = await callsRes.json()
          const list = (data.calls ?? []).map((c: any) => ({
            id: c.id,
            name: c.peer?.nickname ?? "익명",
            meta: c.peer?.countryCode ? c.peer.countryCode : "상관없음",
            duration: c.durationSec != null ? fmtTimer(c.durationSec) : "00:00",
          }))
          setRecentCalls(list)
        }

        if (friendsRes.ok) {
          const data = await friendsRes.json()
          const list = (data.friends ?? []).map((f: any) => ({
            id: f.id,
            name: f.nickname ?? "익명",
            status: "온라인",
            online: true,
            emoji: "🙂",
            countryCode: f.countryCode,
            gender: f.gender,
          }))
          setFriends(list)
        }

        if (reqsRes.ok) {
          const data = await reqsRes.json()
          setReceivedRequests(data.received ?? [])
          setSentRequests(data.sent ?? [])
        }
      } finally {
        setLoadingProfile(false)
      }
    }

    loadAll()
    window.addEventListener("focus", loadAll)
    return () => window.removeEventListener("focus", loadAll)
  }, [session])

  // ── 스트림 → video 요소에 적용 (타이밍 문제 해결) ────────────
  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
  }, [remoteStream])

  // Task 3: mic/cam actual track toggle
  useEffect(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !micOff })
  }, [micOff])

  useEffect(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !camOff })
  }, [camOff])

  // Task 5: ESC key closes modals
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setReportOpen(false)
        setPaymentOpen(false)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // Task 8: beforeunload warning during call
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (inCall) { e.preventDefault(); e.returnValue = "" }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [inCall])

  // ── Socket.io + WebRTC ──────────────────────────────────────
  useEffect(() => {
    const setup = async () => {
      // 서버에서 서명된 소켓 인증 토큰 발급
      let token = ""
      try {
        const res = await fetch("/api/socket-token")
        if (res.ok) {
          const data = await res.json()
          token = data.token ?? ""
        }
      } catch (_) {}

      const socket = getSocket()
      socket.auth = { token }
      socketRef.current = socket
      socket.connect()
    }
    setup()

    const socket = getSocket()

    // ICE candidate를 remote description 설정 후 드레인하는 헬퍼
    async function drainIceBuffer(pc: RTCPeerConnection) {
      for (const c of iceCandidateBuffer.current) {
        try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch (_) {}
      }
      iceCandidateBuffer.current = []
    }

    // 매칭 성사 — 서버가 isInitiator 결정
    socket.on("match:found", async (data: {
      peerId: string; peerUserId: string; peerNickname: string; isInitiator: boolean
    }) => {
      // 이미 취소된 매칭 요청의 stale 응답 무시
      if (!isMatchingRef.current) return
      isMatchingRef.current = false
      setMatching(false)
      if (matchTimerRef.current) clearInterval(matchTimerRef.current)
      setActivePeer({ id: data.peerUserId, name: data.peerNickname })
      activePeerSocketIdRef.current = data.peerId
      setInCall(true)
      setCallTimer(0)
      callTimerRef.current = setInterval(() => setCallTimer(s => s + 1), 1000)
      await startWebRTC(data.peerId, data.isInitiator)
    })

    // Offer 수신 (non-initiator 쪽)
    socket.on("webrtc:offer", async (data: { from: string; sdp: any }) => {
      await startWebRTC(data.from, false)
      const pc = peerConnectionRef.current!
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
      await drainIceBuffer(pc)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit("webrtc:answer", { targetId: data.from, sdp: pc.localDescription })
    })

    // Answer 수신 (initiator 쪽)
    socket.on("webrtc:answer", async (data: { sdp: any }) => {
      const pc = peerConnectionRef.current
      if (!pc) return
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
      await drainIceBuffer(pc)
    })

    // ICE candidate — remote description 없으면 버퍼에 쌓기
    socket.on("webrtc:ice", async (data: { candidate: any }) => {
      const pc = peerConnectionRef.current
      if (!pc || !data.candidate) return
      if (pc.remoteDescription) {
        try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)) } catch (_) {}
      } else {
        iceCandidateBuffer.current.push(data.candidate)
      }
    })

    socket.on("call:ended", () => {
      cleanupWebRTC()
      setInCall(false)
      setActivePeer(null)
      activePeerSocketIdRef.current = null
      if (callTimerRef.current) clearInterval(callTimerRef.current)
      showToast("상대방이 통화를 종료했습니다")
    })

    socket.on("message:receive", (data: { text: string; time: string }) => {
      const d = new Date(data.time)
      const h = d.getHours()
      const time = h >= 12
        ? `오후 ${h - 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`
        : `오전 ${h}:${String(d.getMinutes()).padStart(2, "0")}`
      setMessages(m => [...m, { mine: false, text: data.text, time }])
    })

    socket.on("friend:incoming", (data: { fromSocketId: string; fromUserId: string; fromNickname: string }) => {
      setFriendRequest(data)
    })

    socket.on("friend:response", (data: { accepted: boolean; responderNickname: string }) => {
      if (data.accepted) {
        showToast(`${data.responderNickname}님이 친구 요청을 수락했습니다!`)
      } else {
        showToast(`${data.responderNickname}님이 친구 요청을 거절했습니다`)
      }
    })

    return () => {
      socket.disconnect()
      cleanupWebRTC()
    }
  }, [])

  async function startWebRTC(peerId: string, isInitiator: boolean) {
    const socket = socketRef.current
    iceCandidateBuffer.current = []

    // 카메라+마이크 획득 (권한 거부 시 명확한 안내)
    let stream: MediaStream | null = null
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        showToast("카메라/마이크 권한이 필요합니다. 브라우저 주소창 옆 자물쇠 아이콘에서 허용해주세요.", "error")
        cancelMatching()
        return
      }
      // 비디오 없이 오디오만 시도
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }) } catch (_) {}
    }
    if (!stream) {
      showToast("카메라 또는 마이크를 사용할 수 없습니다. 장치를 확인해주세요.", "error")
      cancelMatching()
      return
    }
    localStreamRef.current = stream
    setLocalStream(stream)

    // ICE 서버 목록 (TURN 포함) 서버에서 조회
    let iceServers: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ]
    try {
      const res = await fetch("/api/ice-servers")
      if (res.ok) {
        const data = await res.json()
        if (data.iceServers?.length) iceServers = data.iceServers
      }
    } catch (_) {}

    const pc = new RTCPeerConnection({ iceServers })
    peerConnectionRef.current = pc

    stream.getTracks().forEach((track) => pc.addTrack(track, stream!))

    // 상대방 스트림 수신 — state로 저장해 useEffect가 video에 연결
    pc.ontrack = (event) => {
      const remote = event.streams[0] ?? new MediaStream([event.track])
      setRemoteStream(remote)
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc:ice", { targetId: peerId, candidate: event.candidate.toJSON() })
      }
    }

    if (isInitiator) {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket.emit("webrtc:offer", { targetId: peerId, sdp: pc.localDescription })
    }
  }

  function cleanupWebRTC() {
    peerConnectionRef.current?.close()
    peerConnectionRef.current = null
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    iceCandidateBuffer.current = []
    setLocalStream(null)
    setRemoteStream(null)
  }
  // ────────────────────────────────────────────────────────────

  const togglePanel = (panel: ActivePanel) => {
    if (activePanel === panel) {
      setActivePanel(null)
      setTabOpen(false)
    } else {
      setActivePanel(panel)
      setTabOpen(false)
    }
  }

  const switchTab = (tab: ActiveTab) => {
    if (tabOpen && activeTab === tab) {
      setTabOpen(false)
      setChatView(null)
      return
    }
    setActiveTab(tab)
    setTabOpen(true)
    setActivePanel(null)
    setChatView(null)
  }

  const openPayment = (item: {
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
  }) => {
    setPaymentItem({
      ...item,
      avatarCategory: item.avatarCategory ?? "",
      creditAmount: item.creditAmount ?? 0,
      planName: item.planName ?? "",
    })
    setPaymentOpen(true)
  }
  const closePayment = () => setPaymentOpen(false)

  const confirmPayment = async () => {
    if (!session) {
      alert("로그인이 필요합니다")
      return
    }
    if (isPaymentLoading) return
    setIsPaymentLoading(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: paymentItem.name,
          price: paymentItem.priceValue,
          itemType: paymentItem.itemType,
          refName: paymentItem.refName,
          avatarCategory: paymentItem.avatarCategory,
          creditAmount: paymentItem.creditAmount,
          planName: paymentItem.planName,
          userId: (session.user as any).id,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        showToast("결제 준비 중 오류가 발생했습니다. 다시 시도해주세요.", "error")
      }
    } finally {
      setIsPaymentLoading(false)
    }
  }

  const startMatching = () => {
    if (isMatchingLoading || isMatchingRef.current) return
    setIsMatchingLoading(true)
    isMatchingRef.current = true
    setMatching(true)
    setMatchTimer(0)
    matchTimerRef.current = setInterval(() => setMatchTimer(s => s + 1), 1000)
    socketRef.current?.emit("match:join", {
      userId: (session?.user as any)?.id ?? "unknown",
      nickname: (session?.user as any)?.name ?? "익명",
      region: userProfile.region,
      gender: userProfile.gender,
      preferGender: matchGenderPref,
    })
    setIsMatchingLoading(false)
  }

  const cancelMatching = () => {
    isMatchingRef.current = false
    setMatching(false)
    if (matchTimerRef.current) clearInterval(matchTimerRef.current)
    socketRef.current?.emit("match:cancel")
  }

  const nextMatch = () => {
    isMatchingRef.current = true
    socketRef.current?.emit("match:next", {
      userId: (session?.user as any)?.id ?? "unknown",
      nickname: (session?.user as any)?.name ?? "익명",
      region: userProfile.region,
      gender: userProfile.gender,
      preferGender: matchGenderPref,
    })
    cleanupWebRTC()
    setInCall(false)
    setActivePeer(null)
    activePeerSocketIdRef.current = null
    setMatching(true)
    setMatchTimer(0)
    matchTimerRef.current = setInterval(() => setMatchTimer(s => s + 1), 1000)
  }

  const endCall = async () => {
    isMatchingRef.current = false
    socketRef.current?.emit("call:end")
    cleanupWebRTC()
    setInCall(false)
    activePeerSocketIdRef.current = null
    if (callTimerRef.current) clearInterval(callTimerRef.current)
    if (activePeer) {
      await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId: activePeer.id, durationSec: callTimer }),
      })
      const callsRes = await fetch("/api/calls/recent")
      if (callsRes.ok) {
        const data = await callsRes.json()
        const list = (data.calls ?? []).map((c: any) => ({
          id: c.id,
          name: c.peer?.nickname ?? "익명",
          meta: c.peer?.countryCode ? c.peer.countryCode : "상관없음",
          duration: c.durationSec != null ? fmtTimer(c.durationSec) : "00:00",
        }))
        setRecentCalls(list)
      }
    }
    setActivePeer(null)
  }

  const sendMsg = () => {
    if (!chatMsg.trim()) return
    const now = new Date()
    const time = now.getHours() >= 12
      ? `오후 ${now.getHours() - 12 || 12}:${String(now.getMinutes()).padStart(2, "0")}`
      : `오전 ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`
    setMessages(m => [...m, { mine: true, text: chatMsg, time }])
    socketRef.current?.emit("message:send", { text: chatMsg })
    setChatMsg("")
  }

  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToast(msg)
    setToastType(type)
    setTimeout(() => setToast(null), 3000)
  }

  const addFriend = async () => {
    if (!activePeer || !activePeerSocketIdRef.current) return
    if (isAddFriendLoading) return
    setIsAddFriendLoading(true)
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: activePeer.id, autoAccept: false }),
      })
      if (res.ok) {
        socketRef.current?.emit("friend:request", {
          targetSocketId: activePeerSocketIdRef.current,
          fromUserId: (session?.user as any)?.id ?? "unknown",
          fromNickname: (session?.user as any)?.name ?? "익명",
        })
        showToast("친구 요청을 보냈습니다!", "success")
      } else {
        const data = await res.json().catch(() => ({}))
        showToast(data.error ?? "친구 요청 실패", "error")
      }
    } finally {
      setIsAddFriendLoading(false)
    }
  }

  const submitReport = async () => {
    if (!activePeer) return
    if (isReportLoading) return
    setIsReportLoading(true)
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: activePeer.id, reason: reportReason }),
      })
      setReportOpen(false)
      showToast("신고가 접수되었습니다", "success")
    } finally {
      setIsReportLoading(false)
    }
  }

  function fmtTimer(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
  }
  const nickname = session?.user?.name ?? (session?.user as any)?.nickname ?? "익명"

  return (
    <>
      <style>{`
        :root[data-theme="dark"] {
          --bg:#080810; --sidebar-bg:#0d0d1a; --sidebar-border:rgba(255,255,255,0.07);
          --panel-bg:#111122; --video-bg:#0a0a16; --text-primary:#ffffff;
          --text-sub:rgba(255,255,255,0.50); --text-dim:rgba(255,255,255,0.28);
          --menu-hover:rgba(255,255,255,0.06); --menu-active-bg:rgba(124,58,237,0.16); --menu-active-bdr:rgba(124,58,237,0.50);
          --tab-line:rgba(255,255,255,0.07); --tab-inactive:rgba(255,255,255,0.35);
          --card-bg:rgba(255,255,255,0.04); --card-border:rgba(255,255,255,0.09); --card-hover:rgba(255,255,255,0.07);
          --card-sel:rgba(124,58,237,0.18); --card-sel-bdr:rgba(124,58,237,0.65); --divider:rgba(255,255,255,0.06);
          --pro-bg:rgba(124,58,237,0.14); --pro-border:rgba(124,58,237,0.35);
          --credit-bg:rgba(255,255,255,0.06); --credit-border:rgba(255,255,255,0.12);
          --list-hover:rgba(255,255,255,0.04); --badge-online:#22c55e;
        }
        :root[data-theme="light"] {
          --bg:#f8f7ff; --sidebar-bg:#ffffff; --sidebar-border:rgba(15,15,26,0.08);
          --panel-bg:#f0eeff; --video-bg:#e8e5ff; --text-primary:#0f0f1a;
          --text-sub:rgba(15,15,26,0.50); --text-dim:rgba(15,15,26,0.30);
          --menu-hover:rgba(15,15,26,0.04); --menu-active-bg:rgba(124,58,237,0.09); --menu-active-bdr:rgba(124,58,237,0.40);
          --tab-line:rgba(15,15,26,0.08); --tab-inactive:rgba(15,15,26,0.35);
          --card-bg:rgba(15,15,26,0.025); --card-border:rgba(15,15,26,0.08); --card-hover:rgba(15,15,26,0.05);
          --card-sel:rgba(124,58,237,0.09); --card-sel-bdr:rgba(124,58,237,0.50); --divider:rgba(15,15,26,0.07);
          --pro-bg:rgba(124,58,237,0.07); --pro-border:rgba(124,58,237,0.22);
          --credit-bg:rgba(15,15,26,0.05); --credit-border:rgba(15,15,26,0.10);
          --list-hover:rgba(15,15,26,0.03); --badge-online:#16a34a;
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;font-family:'Noto Sans KR',sans-serif;background:var(--bg);color:var(--text-primary);overflow:hidden;transition:background 0.4s,color 0.4s}
        .gradient-text{background:linear-gradient(135deg,#a78bfa,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .app{display:flex;height:100vh;overflow:hidden}
        .sidebar{width:156px;flex-shrink:0;background:var(--sidebar-bg);border-right:1px solid var(--sidebar-border);display:flex;flex-direction:column;transition:background 0.4s,border-color 0.4s;z-index:10}
        .sidebar-logo{padding:20px 18px 16px;font-family:'Outfit',sans-serif;font-weight:800;font-size:18px;letter-spacing:-0.5px;color:var(--text-primary);transition:color 0.4s;cursor:pointer;flex-shrink:0}
        .sidebar-logo:hover{opacity:0.65}
        .menu-list{display:flex;flex-direction:column;gap:3px;padding:6px 10px;flex:1}
        .menu-item{padding:11px 12px;border-radius:11px;border:1px solid transparent;cursor:pointer;transition:background 0.2s,border-color 0.2s;user-select:none}
        .menu-item:hover{background:var(--menu-hover)}
        .menu-item.active{background:var(--menu-active-bg);border-color:var(--menu-active-bdr)}
        .menu-label{font-size:13px;font-weight:700;letter-spacing:-0.3px}
        .menu-item.active .menu-label{color:#a78bfa}
        .menu-sub{font-size:10.5px;color:var(--text-dim);margin-top:1px}
        .sidebar-footer{padding:10px 10px 14px;border-top:1px solid var(--divider)}
        .profile-row{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:10px;cursor:pointer;transition:background 0.2s}
        .profile-row:hover{background:var(--menu-hover)}
        .profile-pic{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;position:relative}
        .online-dot{position:absolute;bottom:0;right:0;width:9px;height:9px;border-radius:50%;background:var(--badge-online);border:2px solid var(--sidebar-bg)}
        .profile-name{font-size:12.5px;font-weight:700}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden}
        .topbar{display:flex;align-items:center;justify-content:space-between;padding:0 20px;height:52px;flex-shrink:0;border-bottom:1px solid var(--tab-line)}
        .tabs{display:flex}
        .tab{padding:0 16px;height:52px;display:flex;align-items:center;font-size:13px;font-weight:600;letter-spacing:-0.2px;color:var(--tab-inactive);cursor:pointer;border-bottom:2px solid transparent;transition:color 0.2s,border-color 0.2s}
        .tab:hover{color:var(--text-sub)}
        .tab.active{color:var(--text-primary);border-bottom-color:#7c3aed}
        .topbar-right{display:flex;align-items:center;gap:10px}
        .credit-badge{display:flex;align-items:center;gap:6px;padding:7px 13px;border-radius:10px;background:var(--credit-bg);border:1px solid var(--credit-border);font-size:12.5px;font-weight:700;cursor:pointer;transition:background 0.2s}
        .credit-badge:hover{background:var(--card-hover)}
        .plan-badge-top{padding:7px 13px;border-radius:10px;background:var(--pro-bg);border:1px solid var(--pro-border);font-size:12px;font-weight:700;color:#a78bfa;cursor:pointer}
        .credit-val{font-family:'Outfit',sans-serif}
        .theme-toggle{width:36px;height:36px;border-radius:8px;border:1px solid var(--card-border);background:var(--card-bg);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;transition:background 0.2s,transform 0.15s}
        .theme-toggle:hover{transform:scale(1.07);background:var(--card-hover)}
        .content{flex:1;display:flex;overflow:hidden;position:relative}
        .tab-overlay{width:0;overflow:hidden;flex-shrink:0;background:var(--sidebar-bg);border-right:1px solid var(--sidebar-border);z-index:60;display:flex;flex-direction:column;transition:width 0.38s cubic-bezier(0.4,0,0.2,1),background 0.4s,border-color 0.4s}
        .tab-overlay.open{width:280px}
        .overlay-header{padding:18px 18px 10px;font-size:14px;font-weight:800;letter-spacing:-0.4px;flex-shrink:0;min-width:280px}
        .overlay-list{flex:1;overflow-y:auto;padding:4px 10px 12px;min-width:280px}
        .overlay-list::-webkit-scrollbar{width:3px}
        .overlay-list::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.3);border-radius:99px}
        .call-item{display:flex;align-items:center;gap:12px;padding:10px 10px;border-radius:12px;cursor:pointer;transition:background 0.2s}
        .call-item:hover{background:var(--list-hover)}
        .call-avatar{width:40px;height:40px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px;background:linear-gradient(135deg,rgba(124,58,237,0.2),rgba(6,182,212,0.15));border:1px solid rgba(124,58,237,0.2)}
        .call-info{flex:1;min-width:0}
        .call-name{font-size:13px;font-weight:700;letter-spacing:-0.2px}
        .call-meta{font-size:11.5px;color:var(--text-dim);margin-top:2px}
        .call-duration{font-family:'Outfit',sans-serif;font-size:12px;color:var(--text-sub);font-weight:600;flex-shrink:0}
        .friend-item{display:flex;align-items:center;gap:11px;padding:9px 10px;border-radius:12px;cursor:pointer;transition:background 0.2s}
        .friend-item:hover{background:var(--list-hover)}
        .friend-avatar{width:38px;height:38px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:17px;position:relative;background:linear-gradient(135deg,rgba(124,58,237,0.2),rgba(6,182,212,0.15));border:1px solid rgba(124,58,237,0.2)}
        .friend-online-dot{position:absolute;bottom:0;right:0;width:10px;height:10px;border-radius:50%;background:var(--badge-online);border:2px solid var(--sidebar-bg)}
        .friend-name{font-size:13px;font-weight:700;letter-spacing:-0.2px}
        .friend-status{font-size:11px;color:var(--text-dim);margin-top:2px}
        .friend-actions{display:flex;gap:6px;flex-shrink:0}
        .f-btn{width:30px;height:30px;border-radius:8px;border:1px solid var(--card-border);background:var(--card-bg);display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;transition:background 0.2s,transform 0.15s}
        .f-btn:hover{background:var(--card-hover);transform:scale(1.08)}
        .f-btn.call-btn{border-color:rgba(124,58,237,0.3);background:rgba(124,58,237,0.08)}
        .f-btn.call-btn:hover{background:rgba(124,58,237,0.18)}
        .slide-panel{width:0;overflow:hidden;background:var(--panel-bg);border-right:1px solid var(--sidebar-border);transition:width 0.38s cubic-bezier(0.4,0,0.2,1),border-color 0.4s;flex-shrink:0;display:flex;flex-direction:column;z-index:55}
        .slide-panel.open{width:272px}
        .panel-inner{width:272px;padding:22px 18px;display:flex;flex-direction:column;gap:18px;height:100%;overflow-y:auto}
        .panel-inner::-webkit-scrollbar{width:3px}
        .panel-inner::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.3);border-radius:99px}
        .panel-title{font-size:15px;font-weight:800;letter-spacing:-0.4px;flex-shrink:0}
        .panel-sec-label{font-size:10.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-dim);margin-bottom:8px}
        .avatar-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
        .avatar-card{aspect-ratio:1;border-radius:13px;border:1.5px solid var(--card-border);background:var(--card-bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;position:relative;transition:background 0.2s,border-color 0.2s,transform 0.15s;overflow:hidden}
        .avatar-card:hover{background:var(--card-hover);transform:scale(1.05)}
        .avatar-card.selected{background:var(--card-sel);border-color:var(--card-sel-bdr)}
        .avatar-emoji{font-size:26px}
        .avatar-name{font-size:10px;font-weight:600;color:var(--text-sub)}
        .avatar-card.selected .avatar-name{color:#a78bfa}
        .avatar-price{font-size:9.5px;font-weight:700;color:var(--text-dim)}
        .avatar-price.free{color:#34d399}
        .avatar-tab-bar{display:flex;gap:4px;background:var(--card-bg);border:1px solid var(--card-border);border-radius:10px;padding:3px;flex-shrink:0}
        .avatar-tab{flex:1;padding:7px 0;border-radius:7px;border:none;background:none;cursor:pointer;font-family:'Noto Sans KR',sans-serif;font-size:12px;font-weight:700;letter-spacing:-0.2px;color:var(--text-dim);transition:background 0.2s,color 0.2s}
        .avatar-tab:hover{color:var(--text-sub)}
        .avatar-tab.active{background:linear-gradient(135deg,rgba(124,58,237,0.3),rgba(6,182,212,0.2));color:#a78bfa}
        .celeb-notice{font-size:12.5px;color:var(--text-dim);line-height:1.6;margin-top:4px}
        .celeb-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
        .celeb-card{aspect-ratio:1;border-radius:13px;border:1.5px solid var(--card-border);background:var(--card-bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;position:relative;transition:background 0.2s,border-color 0.2s,transform 0.15s;overflow:hidden}
        .celeb-card:hover{background:var(--card-hover);transform:scale(1.04)}
        .celeb-card.selected{background:var(--card-sel);border-color:var(--card-sel-bdr)}
        .celeb-face{width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;font-weight:800}
        .celeb-name{font-size:10px;font-weight:700;color:var(--text-sub);text-align:center;line-height:1.2}
        .celeb-group{font-size:9.5px;color:var(--text-dim);font-weight:500}
        .celeb-price{font-size:9.5px;font-weight:700;color:var(--text-dim)}
        .voice-list{display:flex;flex-direction:column;gap:6px}
        .voice-card{padding:11px 12px;border-radius:11px;border:1.5px solid var(--card-border);background:var(--card-bg);cursor:pointer;display:flex;align-items:center;gap:10px;transition:background 0.2s,border-color 0.2s,transform 0.15s}
        .voice-card:hover{background:var(--card-hover);transform:translateX(2px)}
        .voice-card.selected{background:var(--card-sel);border-color:var(--card-sel-bdr)}
        .voice-dot{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;background:var(--card-bg)}
        .voice-name{font-size:13px;font-weight:700;letter-spacing:-0.2px}
        .voice-card.selected .voice-name{color:#a78bfa}
        .voice-desc{font-size:11px;color:var(--text-dim);margin-top:2px}
        .voice-check{font-size:12px;color:#a78bfa;opacity:0}
        .voice-card.selected .voice-check{opacity:1}
        .t-list{display:flex;flex-direction:column;gap:8px}
        .t-card{padding:13px 14px;border-radius:13px;border:1.5px solid var(--card-border);background:var(--card-bg);cursor:pointer;transition:background 0.2s,border-color 0.2s}
        .t-card:hover:not(.selected){background:var(--card-hover)}
        .t-card.selected{background:var(--card-sel);border-color:var(--card-sel-bdr)}
        .t-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px}
        .t-title{font-size:13.5px;font-weight:700;letter-spacing:-0.3px;display:flex;align-items:center;gap:6px}
        .t-card.selected .t-title{color:#a78bfa}
        .t-desc{font-size:12px;color:var(--text-dim);line-height:1.55}
        .radio{width:16px;height:16px;border-radius:50%;border:2px solid var(--card-border);flex-shrink:0;display:flex;align-items:center;justify-content:center}
        .t-card.selected .radio{border-color:#7c3aed}
        .radio-dot{width:7px;height:7px;border-radius:50%;background:#7c3aed;opacity:0}
        .t-card.selected .radio-dot{opacity:1}
        .plan-tip{font-size:11.5px;color:var(--text-dim);line-height:1.6;padding:9px 12px;background:var(--pro-bg);border:1px solid var(--pro-border);border-radius:10px}
        .plan-tip span{color:#a78bfa;font-weight:700}
        .video-wrap{flex:1;display:flex;flex-direction:column;background:var(--video-bg);position:relative;overflow:hidden;transition:background 0.4s}
        .video-wrap::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 55% 55% at 50% 50%,rgba(124,58,237,0.07) 0%,transparent 70%);pointer-events:none}
        .cam-label{position:absolute;top:16px;left:50%;transform:translateX(-50%);font-size:11px;color:var(--text-dim);font-weight:500;background:var(--card-bg);border:1px solid var(--card-border);padding:4px 12px;border-radius:99px;backdrop-filter:blur(8px)}
        .video-center{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;position:relative;z-index:1}
        .avatar-preview-ring{width:130px;height:130px;border-radius:50%;background:linear-gradient(135deg,rgba(124,58,237,0.25),rgba(6,182,212,0.25));border:2px solid rgba(124,58,237,0.2);display:flex;align-items:center;justify-content:center;font-size:62px;animation:float 5s ease-in-out infinite}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        .avatar-status{font-size:13px;color:var(--text-dim);font-weight:500}
        .video-controls{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;z-index:2}
        .ctrl-btn{width:46px;height:46px;border-radius:50%;border:1px solid var(--card-border);background:var(--card-bg);display:flex;align-items:center;justify-content:center;font-size:19px;cursor:pointer;backdrop-filter:blur(12px);transition:background 0.2s,transform 0.15s}
        .ctrl-btn:hover{background:var(--card-hover);transform:scale(1.08)}
        .ctrl-btn.off{background:rgba(239,68,68,0.10);border-color:rgba(239,68,68,0.25);opacity:0.6}
        .match-btn{padding:12px 26px;border-radius:99px;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;font-size:14px;font-weight:700;border:none;cursor:pointer;font-family:'Noto Sans KR',sans-serif;box-shadow:0 4px 22px rgba(124,58,237,0.38);transition:opacity 0.2s,transform 0.15s;display:flex;align-items:center;gap:7px}
        .match-btn:hover{opacity:0.88;transform:translateY(-2px)}
        .match-pulse{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,0.85);animation:mpulse 1.5s infinite}
        @keyframes mpulse{0%,100%{opacity:1}50%{opacity:0.3}}
        .matching-overlay{position:absolute;inset:0;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--video-bg);overflow:hidden}
        .sonar-wrap{position:relative;display:flex;align-items:center;justify-content:center;width:320px;height:320px}
        .sonar-ring{position:absolute;border-radius:50%;border:1.5px solid rgba(124,58,237,0.5);animation:sonarPulse 2.8s ease-out infinite;width:120px;height:120px}
        .sonar-ring:nth-child(1){animation-delay:0s}.sonar-ring:nth-child(2){animation-delay:0.7s}.sonar-ring:nth-child(3){animation-delay:1.4s}.sonar-ring:nth-child(4){animation-delay:2.1s}
        @keyframes sonarPulse{0%{width:120px;height:120px;opacity:0.85;border-color:rgba(124,58,237,0.55)}100%{width:310px;height:310px;opacity:0;border-color:rgba(124,58,237,0)}}
        .sonar-center{position:relative;z-index:2;width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,rgba(124,58,237,0.28),rgba(6,182,212,0.22));border:2px solid rgba(124,58,237,0.38);display:flex;align-items:center;justify-content:center;font-size:56px}
        .matching-status{margin-top:32px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px;position:relative;z-index:2}
        .matching-title{font-size:17px;font-weight:800;letter-spacing:-0.5px}
        .matching-sub{font-size:13px;color:var(--text-dim)}
        .matching-timer{font-family:'Outfit',sans-serif;font-size:12.5px;color:var(--text-dim);font-weight:600}
        .cancel-btn{margin-top:22px;position:relative;z-index:2;padding:11px 28px;border-radius:99px;border:1px solid var(--card-border);background:var(--card-bg);color:var(--text-sub);font-size:13.5px;font-weight:600;cursor:pointer;font-family:'Noto Sans KR',sans-serif;backdrop-filter:blur(12px);transition:background 0.25s,color 0.25s}
        .cancel-btn:hover{background:rgba(239,68,68,0.14);border-color:rgba(239,68,68,0.45);color:#f87171}
        .call-screen{position:absolute;inset:0;z-index:55;display:flex;flex-direction:column;background:var(--video-bg);overflow:hidden}
        .call-opponent{flex:1;display:flex;align-items:center;justify-content:center;position:relative;background:radial-gradient(ellipse 55% 55% at 50% 50%,rgba(124,58,237,0.08) 0%,transparent 70%)}
        .opponent-avatar{font-size:120px;animation:float 5s ease-in-out infinite}
        .call-topbar{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:18px 20px;z-index:3}
        .opponent-info{display:flex;align-items:center;gap:12px}
        .opponent-pic{width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,rgba(124,58,237,0.3),rgba(6,182,212,0.25));border:2px solid rgba(124,58,237,0.3);display:flex;align-items:center;justify-content:center;font-size:22px;backdrop-filter:blur(8px)}
        .opponent-name{font-size:14px;font-weight:800;letter-spacing:-0.3px}
        .opponent-tag{font-size:11px;color:var(--text-dim)}
        .call-live-timer{font-family:'Outfit',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.5px;color:rgba(255,255,255,0.4)}
        .call-action-btns{display:flex;gap:8px}
        .call-action-btn{padding:7px 14px;border-radius:99px;border:1px solid var(--card-border);background:var(--card-bg);font-size:12.5px;font-weight:700;cursor:pointer;backdrop-filter:blur(12px);transition:background 0.2s,transform 0.15s;font-family:'Noto Sans KR',sans-serif;color:var(--text-primary);display:flex;align-items:center;gap:5px}
        .call-action-btn:hover{background:var(--card-hover);transform:translateY(-1px)}
        .call-bottom{position:absolute;bottom:0;left:0;right:0;display:flex;align-items:flex-end;justify-content:center;padding:20px 20px 24px;z-index:3}
        .my-pip-wrap{position:absolute;bottom:24px;right:20px;display:flex;flex-direction:column;align-items:center;gap:8px}
        .my-pip{width:148px;border-radius:16px;overflow:hidden;border:2px solid rgba(124,58,237,0.3);box-shadow:0 8px 24px rgba(0,0,0,0.3);background:linear-gradient(135deg,rgba(124,58,237,0.2),rgba(6,182,212,0.15));aspect-ratio:4/3;display:flex;flex-direction:column}
        .pip-inner{flex:1;display:flex;align-items:center;justify-content:center;font-size:40px}
        .pip-label{font-size:10px;font-weight:700;color:rgba(255,255,255,0.5);text-align:center;padding-bottom:6px}
        .call-center-btns{display:flex;flex-direction:column;align-items:center;gap:10px}
        .next-match-btn{padding:11px 28px;border-radius:99px;background:var(--card-bg);border:1px solid var(--card-border);color:var(--text-primary);font-size:13.5px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;backdrop-filter:blur(12px);transition:background 0.2s,transform 0.15s}
        .next-match-btn:hover{background:var(--card-hover);transform:translateY(-1px)}
        .next-match-btn.end-call{border-color:rgba(239,68,68,0.4);background:rgba(239,68,68,0.12);color:#f87171}
        .next-match-btn.end-call:hover{background:rgba(239,68,68,0.22);border-color:rgba(239,68,68,0.6)}
        .call-ctrl-row{display:flex;gap:8px}
        .call-ctrl-btn{width:44px;height:44px;border-radius:50%;border:1px solid var(--card-border);background:var(--card-bg);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;backdrop-filter:blur(12px);transition:background 0.2s,transform 0.15s}
        .call-ctrl-btn:hover{background:var(--card-hover);transform:scale(1.08)}
        .call-ctrl-btn.off{background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.25);opacity:0.6}
        .chat-header{display:flex;align-items:center;gap:10px;padding:14px 14px 12px;border-bottom:1px solid var(--divider);flex-shrink:0;min-width:280px}
        .chat-back-btn{width:30px;height:30px;border-radius:8px;border:1px solid var(--card-border);background:var(--card-bg);display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;flex-shrink:0;transition:background 0.2s;color:var(--text-primary);font-family:'Outfit',sans-serif;font-weight:600}
        .chat-back-btn:hover{background:var(--card-hover)}
        .chat-peer-pic{width:34px;height:34px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,rgba(124,58,237,0.25),rgba(6,182,212,0.2));border:1.5px solid rgba(124,58,237,0.25);display:flex;align-items:center;justify-content:center;font-size:16px}
        .chat-peer-name{font-size:13px;font-weight:800;letter-spacing:-0.3px}
        .chat-peer-status{font-size:10.5px;color:#34d399;font-weight:600;margin-top:1px}
        .chat-messages{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:6px;min-width:280px}
        .chat-messages::-webkit-scrollbar{width:3px}
        .msg-row{display:flex;align-items:flex-end;gap:7px}
        .msg-row.mine{flex-direction:row-reverse}
        .msg-avatar{width:26px;height:26px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,rgba(124,58,237,0.2),rgba(6,182,212,0.15));border:1px solid rgba(124,58,237,0.2);display:flex;align-items:center;justify-content:center;font-size:12px}
        .msg-bubble{max-width:195px;padding:9px 12px;border-radius:18px;font-size:13px;line-height:1.5;word-break:break-word}
        .msg-row:not(.mine) .msg-bubble{background:var(--card-bg);border:1px solid var(--card-border);color:var(--text-primary);border-bottom-left-radius:5px}
        .msg-row.mine .msg-bubble{background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;border-bottom-right-radius:5px}
        .msg-time{font-size:10px;color:var(--text-dim);margin-bottom:2px;flex-shrink:0}
        .chat-input-wrap{display:flex;align-items:center;gap:8px;padding:10px 12px 14px;flex-shrink:0;border-top:1px solid var(--divider);min-width:280px}
        .chat-input{flex:1;background:var(--card-bg);border:1px solid var(--card-border);border-radius:99px;padding:9px 14px;font-size:13px;color:var(--text-primary);outline:none;font-family:'Noto Sans KR',sans-serif;transition:background 0.2s,border-color 0.25s,color 0.4s}
        .chat-input::placeholder{color:var(--text-dim)}
        .chat-input:focus{border-color:rgba(124,58,237,0.5);background:var(--card-hover)}
        .chat-send-btn{width:34px;height:34px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#7c3aed,#06b6d4);border:none;color:#fff;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:opacity 0.2s,transform 0.15s;box-shadow:0 2px 10px rgba(124,58,237,0.35)}
        .chat-send-btn:hover{opacity:0.88;transform:scale(1.08)}
        .rpg-lock-banner{display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px 16px;text-align:center;background:var(--pro-bg);border:1px solid var(--pro-border);border-radius:16px}
        .rpg-lock-title{font-size:13.5px;font-weight:800;letter-spacing:-0.3px;color:#a78bfa}
        .rpg-lock-desc{font-size:12px;color:var(--text-dim);line-height:1.6}
        .rpg-lock-btn{margin-top:4px;padding:9px 20px;border-radius:99px;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;font-size:12.5px;font-weight:700;border:none;cursor:pointer;font-family:'Noto Sans KR',sans-serif}
        .modal-backdrop{position:fixed;inset:0;background:rgba(5,5,10,0.55);display:none;align-items:center;justify-content:center;z-index:200}
        .modal-backdrop.open{display:flex;animation:modalFade 0.22s ease}
        @keyframes modalFade{from{opacity:0}to{opacity:1}}
        .payment-modal{width:min(420px,92vw);background:var(--panel-bg);border:1px solid var(--card-border);border-radius:18px;padding:18px 18px 16px;box-shadow:0 18px 60px rgba(0,0,0,0.35)}
        .plans-modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
        .plans-modal-title{font-size:16px;font-weight:800}
        .modal-close-btn{width:32px;height:32px;border-radius:10px;border:1px solid var(--card-border);background:var(--card-bg);color:var(--text-dim);cursor:pointer}
        .modal-close-btn:hover{background:var(--card-hover);color:var(--text-primary)}
        .payment-item-info{display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;background:var(--card-bg);border:1px solid var(--card-border)}
        .payment-item-thumb{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,rgba(124,58,237,0.3),rgba(6,182,212,0.2));display:flex;align-items:center;justify-content:center;font-size:18px}
        .payment-item-detail{flex:1}
        .payment-item-name{font-size:13.5px;font-weight:700}
        .payment-item-type{font-size:11.5px;color:var(--text-dim);margin-top:2px}
        .payment-item-price{font-size:14px;font-weight:800;color:#a78bfa}
        .pay-section-label{font-size:12px;color:var(--text-sub);margin:14px 0 8px;font-weight:700}
        .pay-method-row{display:flex;gap:8px}
        .pay-method{flex:1;padding:10px;border-radius:12px;border:1px solid var(--card-border);background:var(--card-bg);cursor:pointer;font-size:12.5px;font-weight:700;text-align:center;color:var(--text-sub)}
        .pay-method.active{border-color:var(--card-sel-bdr);background:var(--card-sel);color:#a78bfa}
        .pay-total{display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding:10px 12px;border-radius:12px;background:var(--card-bg);border:1px solid var(--card-border)}
        .pay-total-label{font-size:12px;color:var(--text-dim)}
        .pay-total-val{font-size:14px;font-weight:800}
        .pay-confirm-btn{width:100%;margin-top:10px;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;font-size:13.5px;font-weight:800;cursor:pointer;transition:opacity 0.2s}
        .pay-confirm-btn:hover{opacity:0.88}

        /* ── 추가: 빈 상태 ── */
        .empty-state{display:flex;flex-direction:column;align-items:center;gap:8px;padding:36px 16px;text-align:center}
        .empty-state-icon{font-size:32px;opacity:0.45}
        .empty-state-text{font-size:12.5px;color:var(--text-dim);line-height:1.65}

        /* ── 추가: 친구 서브탭 ── */
        .friend-subtab-bar{display:flex;gap:0;padding:6px 10px 0;flex-shrink:0;border-bottom:1px solid var(--tab-line);min-width:280px}
        .friend-subtab{flex:1;padding:7px 4px;border-radius:8px 8px 0 0;border:none;background:none;cursor:pointer;font-size:11.5px;font-weight:700;color:var(--text-dim);font-family:'Noto Sans KR',sans-serif;transition:color 0.2s;position:relative;white-space:nowrap;display:flex;align-items:center;justify-content:center;gap:4px}
        .friend-subtab:hover{color:var(--text-sub)}
        .friend-subtab.st-active{color:var(--text-primary);box-shadow:inset 0 -2px 0 #7c3aed}

        /* ── 추가: 요청 뱃지 ── */
        .tab-badge{display:inline-flex;align-items:center;justify-content:center;min-width:15px;height:15px;border-radius:99px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;margin-left:4px;padding:0 3px}

        /* ── 추가: 요청 아이템 ── */
        .req-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:12px;transition:background 0.2s}
        .req-item:hover{background:var(--list-hover)}
        .req-btns{display:flex;gap:5px;flex-shrink:0}
        .req-accept{padding:5px 11px;border-radius:8px;border:none;background:linear-gradient(135deg,rgba(124,58,237,0.55),rgba(6,182,212,0.45));color:#fff;font-size:11.5px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;transition:opacity 0.2s}
        .req-accept:hover{opacity:0.82}
        .req-reject{padding:5px 9px;border-radius:8px;border:1px solid rgba(239,68,68,0.3);background:transparent;color:#f87171;font-size:11.5px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;transition:background 0.2s}
        .req-reject:hover{background:rgba(239,68,68,0.1)}
        .req-pending{font-size:11px;color:var(--text-dim);font-weight:600;white-space:nowrap}

        /* ── 추가: 버튼 클릭 피드백 ── */
        .match-btn:active{transform:scale(0.97) translateY(0)!important}
        .next-match-btn:active{transform:scale(0.97)!important}
        .call-action-btn:active{transform:scale(0.97)!important}
        .f-btn:active{transform:scale(0.91)!important}
        .btn-primary:active{transform:scale(0.97)!important}
        .ctrl-btn:active{transform:scale(0.93)!important}

        /* ── 추가: 토스트 슬라이드 애니메이션 ── */
        @keyframes toastSlideUp{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .toast-enter{animation:toastSlideUp 0.22s ease}

        /* ── Task 10: 버튼 로딩 상태 ── */
        .btn-loading{opacity:0.6;cursor:not-allowed!important}

        /* ── Task 9: 토스트 색상 ── */
        .toast-success{background:rgba(20,50,30,0.97)!important;border-color:rgba(34,197,94,0.5)!important}
        .toast-error{background:rgba(50,15,15,0.97)!important;border-color:rgba(239,68,68,0.5)!important}
        .toast-info{background:rgba(30,20,50,0.95)!important;border-color:rgba(124,58,237,0.4)!important}
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet" />

      <div className="app page-transition">
        {/* 사이드바 */}
        <aside className="sidebar">
          <div className="sidebar-logo" onClick={() => router.push("/")}>unface</div>
          <div className="menu-list">
            {[
              { key: "avatar", label: "아바타", sub: "얼굴 변환" },
              { key: "voice", label: "음성", sub: "목소리 변조" },
              { key: "translate", label: "번역", sub: "자막 / 음성" },
            ].map(({ key, label, sub }) => (
              <div key={key} className={`menu-item${activePanel === key ? " active" : ""}`} onClick={() => togglePanel(key as ActivePanel)}>
                <div className="menu-label">{label}</div>
                <div className="menu-sub">{sub}</div>
              </div>
            ))}
          </div>
          <div className="sidebar-footer">
            <div className="profile-row">
              <div className="profile-pic">
                😶<div className="online-dot" />
              </div>
              <span className="profile-name" style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nickname}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                title="로그아웃"
                style={{
                  flexShrink: 0, width: 28, height: 28, borderRadius: 7, border: "1px solid var(--card-border)",
                  background: "none", color: "var(--text-dim)", fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--menu-hover)"; e.currentTarget.style.color = "var(--text-primary)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-dim)" }}
              >↩</button>
            </div>
          </div>
        </aside>

        {/* 메인 */}
        <div className="main">
          {/* 탑바 */}
          <div className="topbar">
            <div className="tabs">
              <div className={`tab${activeTab === "recent" ? " active" : ""}`} onClick={() => switchTab("recent")}>최근 통화</div>
              <div className={`tab${activeTab === "friends" ? " active" : ""}`} onClick={() => switchTab("friends")}>
                친구{receivedRequests.length > 0 && <span className="tab-badge">{receivedRequests.length}</span>}
              </div>
            </div>
            <div className="topbar-right">
              <div className="plan-badge-top" onClick={() => openPayment({ name: "Pro 플랜", type: "구독 · 월간 결제", price: "$1", thumb: "✦", priceValue: 1, itemType: "plan", refName: "Pro", planName: "Pro" })}>✦ Pro</div>
              <div className="credit-badge" onClick={() => openPayment({ name: "통화 크레딧 50회", type: "통화 크레딧", price: "$1", thumb: "📞", priceValue: 1, itemType: "credit", refName: "credits", creditAmount: 50 })}>
                <span>📞</span>
                <span className="credit-val">{credits}</span>
                <span style={{ fontSize: 11, color: "var(--text-dim)" }}>통화</span>
              </div>
              <button className="theme-toggle" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
                {theme === "dark" ? "🌙" : "☀️"}
              </button>
            </div>
          </div>

          {/* 콘텐츠 */}
          <div className="content">
            {/* 최근 통화 오버레이 */}
            <div className={`tab-overlay${tabOpen && activeTab === "recent" ? " open" : ""}`}>
              <div className="overlay-header">최근 통화</div>
              <div className="overlay-list">
                {recentCalls.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📞</div>
                    <div className="empty-state-text">아직 통화 기록이 없어요.<br />첫 통화를 시작해보세요!</div>
                  </div>
                ) : recentCalls.map((c, i) => (
                  <div key={i} className="call-item">
                    <div className="call-avatar">🙂</div>
                    <div className="call-info">
                      <div className="call-name">{c.name}</div>
                      <div className="call-meta">{c.meta}</div>
                    </div>
                    <span className="call-duration">{c.duration}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 친구 오버레이 */}
            <div className={`tab-overlay${tabOpen && activeTab === "friends" ? " open" : ""}`}>
              {!chatView ? (
                <>
                  <div className="overlay-header">친구 <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 500 }}>{friends.filter(f => f.online).length}명 온라인</span></div>
                  {/* 서브탭 */}
                  <div className="friend-subtab-bar">
                    <button className={`friend-subtab${friendSubTab === "list" ? " st-active" : ""}`} onClick={() => setFriendSubTab("list")}>친구 목록</button>
                    <button className={`friend-subtab${friendSubTab === "received" ? " st-active" : ""}`} onClick={() => setFriendSubTab("received")}>
                      받은 요청{receivedRequests.length > 0 && <span className="tab-badge">{receivedRequests.length}</span>}
                    </button>
                    <button className={`friend-subtab${friendSubTab === "sent" ? " st-active" : ""}`} onClick={() => setFriendSubTab("sent")}>보낸 요청</button>
                  </div>

                  {/* 친구 목록 — 메시지 앱 스타일 */}
                  {friendSubTab === "list" && (
                    <div className="overlay-list" style={{ padding: "8px 0" }}>
                      {friends.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-state-icon">🤝</div>
                          <div className="empty-state-text">아직 친구가 없어요.<br />통화하며 만난 사람에게<br />친구 추가해보세요!</div>
                        </div>
                      ) : friends.map((f, i) => (
                        <div
                          key={i}
                          onClick={() => setChatView(f)}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "10px 16px", cursor: "pointer",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--list-hover)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          {/* 아바타 */}
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <div style={{
                              width: 46, height: 46, borderRadius: "50%",
                              background: "var(--card-bg)", border: "1px solid var(--card-border)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 22,
                            }}>{f.emoji}</div>
                            {f.online && (
                              <div style={{
                                position: "absolute", bottom: 1, right: 1,
                                width: 11, height: 11, borderRadius: "50%",
                                background: "var(--badge-online)",
                                border: "2px solid var(--sidebar-bg)",
                              }} />
                            )}
                          </div>
                          {/* 텍스트 */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                            <div style={{ fontSize: 12, color: "var(--text-sub)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {f.online ? "온라인" : "오프라인"}
                            </div>
                          </div>
                          {/* 우측: 시간 + 채팅 버튼 */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{f.online ? "지금" : ""}</div>
                            <div style={{ display: "flex", gap: 4 }}>
                              <div className="f-btn" style={{ width: 28, height: 28, fontSize: 13 }} onClick={e => { e.stopPropagation(); setChatView(f) }}>💬</div>
                              <div className="f-btn call-btn" style={{ width: 28, height: 28, fontSize: 13 }} onClick={e => { e.stopPropagation(); showToast("준비 중이에요") }}>📹</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 받은 요청 */}
                  {friendSubTab === "received" && (
                    <div className="overlay-list">
                      {receivedRequests.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-state-icon">📭</div>
                          <div className="empty-state-text">받은 친구 요청이 없어요.</div>
                        </div>
                      ) : receivedRequests.map((r) => (
                        <div key={r.id} className="req-item">
                          <div className="friend-avatar" style={{ width: 36, height: 36, fontSize: 16 }}>🙂</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="friend-name">{r.sender.nickname ?? "익명"}</div>
                          </div>
                          <div className="req-btns">
                            <button className="req-accept" onClick={async () => {
                              const res = await fetch("/api/friends/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: r.id }) })
                              if (res.ok) {
                                setReceivedRequests(prev => prev.filter(x => x.id !== r.id))
                                const fr = await fetch("/api/friends")
                                if (fr.ok) { const d = await fr.json(); setFriends((d.friends ?? []).map((f: any) => ({ id: f.id, name: f.nickname ?? "익명", status: "온라인", online: true, emoji: "🙂", countryCode: f.countryCode, gender: f.gender }))) }
                                showToast("친구가 됐어요!")
                              }
                            }}>수락</button>
                            <button className="req-reject" onClick={async () => {
                              await fetch("/api/friends/reject", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: r.id }) })
                              setReceivedRequests(prev => prev.filter(x => x.id !== r.id))
                              showToast("요청을 거절했어요")
                            }}>거절</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 보낸 요청 */}
                  {friendSubTab === "sent" && (
                    <div className="overlay-list">
                      {sentRequests.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-state-icon">📤</div>
                          <div className="empty-state-text">보낸 친구 요청이 없어요.</div>
                        </div>
                      ) : sentRequests.map((r) => (
                        <div key={r.id} className="req-item">
                          <div className="friend-avatar" style={{ width: 36, height: 36, fontSize: 16 }}>🙂</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="friend-name">{r.receiver.nickname ?? "익명"}</div>
                          </div>
                          <span className="req-pending">대기 중...</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                  <div className="chat-header">
                    <button className="chat-back-btn" onClick={() => setChatView(null)}>←</button>
                    <div className="chat-peer-pic">{chatView.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div className="chat-peer-name">{chatView.name}</div>
                      <div className="chat-peer-status">온라인</div>
                    </div>
                  </div>
                  <div className="chat-messages">
                    {messages.map((m, i) => (
                      <div key={i} className={`msg-row${m.mine ? " mine" : ""}`}>
                        {!m.mine && <div className="msg-avatar">{chatView.emoji}</div>}
                        <div>
                          <div className="msg-bubble">{m.text}</div>
                        </div>
                        <div className="msg-time">{m.time}</div>
                      </div>
                    ))}
                  </div>
                  <div className="chat-input-wrap">
                    <input className="chat-input" placeholder="메시지 입력..." value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) sendMsg() }} />
                    <button className="chat-send-btn" onClick={sendMsg}>↑</button>
                  </div>
                </div>
              )}
            </div>

            {/* 슬라이드 패널 */}
            <div className={`slide-panel${activePanel ? " open" : ""}`}>
              <div className="panel-inner">
                {/* 아바타 패널 */}
                {activePanel === "avatar" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <p className="panel-title"><span className="gradient-text">아바타</span></p>
                    <div className="avatar-tab-bar">
                      {(["basic", "celeb", "rpg"] as AvatarTab[]).map((t, i) => (
                        <button key={t} className={`avatar-tab${avatarTab === t ? " active" : ""}`} onClick={() => setAvatarTab(t)}>
                          {["캐릭터", "셀럽 AI", "RPG"][i]}
                        </button>
                      ))}
                    </div>
                    {avatarTab === "basic" && (
                      <div className="avatar-grid">
                        {AVATARS.map((a, i) => (
                          <div
                            key={i}
                            className={`avatar-card${selectedAvatar === i ? " selected" : ""}`}
                            onClick={async () => {
                              const owned = ownedAvatarNames.has(a.name) || a.free
                              if (!owned) {
                                openPayment({ name: `${a.name} 아바타`, type: "아바타", price: a.price, thumb: a.emoji, priceValue: 1, itemType: "avatar", refName: a.name, avatarCategory: a.category })
                                return
                              }
                              setSelectedAvatar(i)
                              const avatarId = avatarIdByName[a.name]
                              if (avatarId) {
                                await fetch("/api/avatars/equip", {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ avatarId }),
                                })
                              }
                            }}
                          >
                            <span className="avatar-emoji">{a.emoji}</span>
                            <span className="avatar-name">{a.name}</span>
                            <span className={`avatar-price${a.free ? " free" : ""}`}>
                              {ownedAvatarNames.has(a.name) ? "보유" : a.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {avatarTab === "celeb" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div className="celeb-notice">🤖 셀럽 AI 변환은 선택 후 결제하면 바로 사용할 수 있어요.</div>
                        <div className="celeb-grid">
                          {CELEBS.map((c, i) => (
                            <div
                              key={i}
                              className={`celeb-card${selectedCeleb === i ? " selected" : ""}`}
                              onClick={async () => {
                                if (ownedAvatarNames.has(c.name)) {
                                  setSelectedCeleb(i)
                                  const avatarId = avatarIdByName[c.name]
                                  if (avatarId) {
                                    await fetch("/api/avatars/equip", {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ avatarId }),
                                    })
                                  }
                                  return
                                }
                                openPayment({ name: `${c.name} 셀럽 AI`, type: "셀럽 AI", price: c.price, thumb: c.face, priceValue: 1, itemType: "celeb", refName: c.name, avatarCategory: "HUMAN" })
                              }}
                            >
                              <div className="celeb-face" style={{ background: c.grad }}>{c.face}</div>
                              <span className="celeb-name">{c.name}<br /><span className="celeb-group">{c.group}</span></span>
                              <span className="celeb-price">{ownedAvatarNames.has(c.name) ? "보유" : c.price}</span>
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
                        <button className="rpg-lock-btn" onClick={() => openPayment({ name: "Pro 플랜", type: "구독 · 월간 결제", price: "$1", thumb: "✦", priceValue: 1, itemType: "plan", refName: "Pro", planName: "Pro" })}>플랜 업그레이드 →</button>
                      </div>
                    )}
                  </div>
                )}

                {/* 음성 패널 */}
                {activePanel === "voice" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <p className="panel-title"><span className="gradient-text">음성</span></p>
                    <div className="avatar-tab-bar">
                      {(["morph", "ai"] as VoiceTab[]).map((t, i) => (
                        <button key={t} className={`avatar-tab${voiceTab === t ? " active" : ""}`} onClick={() => setVoiceTab(t)}>
                          {["목소리 변조", "AI 보이스"][i]}
                        </button>
                      ))}
                    </div>
                    {voiceTab === "morph" && (
                      <div className="voice-list">
                        {VOICES.map((v, i) => (
                          <div key={i} className={`voice-card${selectedVoice === i ? " selected" : ""}`} onClick={() => setSelectedVoice(i)}>
                            <div className="voice-dot">{v.dot}</div>
                            <div style={{ flex: 1 }}>
                              <div className="voice-name">{v.name}</div>
                              <div className="voice-desc">{v.desc}</div>
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

                {/* 번역 패널 */}
                {activePanel === "translate" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <p className="panel-title"><span className="gradient-text">번역</span></p>
                    <div className="t-list">
                      {[
                        { icon: "💬", label: "AI 자막", desc: "화면 하단에 번역 자막을 실시간으로 표시해요. 빠르고 가벼워요." },
                        { icon: "🚫", label: "번역 끄기", desc: "번역 기능을 사용하지 않아요." },
                      ].map((t, i) => (
                        <div key={i} className={`t-card${selectedTranslate === i ? " selected" : ""}`} onClick={() => setSelectedTranslate(i)}>
                          <div className="t-top">
                            <div className="t-title">{t.icon} {t.label}</div>
                            <div className="radio"><div className="radio-dot" /></div>
                          </div>
                          <div className="t-desc">{t.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 비디오 영역 */}
            <div className="video-wrap">
              {/* 매칭 오버레이 */}
              {matching && (
                <div className="matching-overlay">
                  <div className="sonar-wrap">
                    <div className="sonar-ring" /><div className="sonar-ring" /><div className="sonar-ring" /><div className="sonar-ring" />
                    <div className="sonar-center">{AVATARS[selectedAvatar].emoji}</div>
                  </div>
                  <div className="matching-status">
                    <div className="matching-title">익명의 친구를 찾는 중...</div>
                    <div className="matching-sub">전 세계 어딘가의 누군가와 연결 중이에요</div>
                    <div className="matching-timer">{fmtTimer(matchTimer)}</div>
                  </div>
                  <button className="cancel-btn" onClick={cancelMatching}>매칭 취소</button>
                </div>
              )}

              {/* 통화 화면 */}
              {inCall && (
                <div className="call-screen">
                  <div className="call-opponent">
                    {/* 상대방 비디오 (실제 연결 시) */}
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      style={{
                        position: "absolute", top: 0, left: 0,
                        width: "100%", height: "100%",
                        objectFit: "cover", borderRadius: "inherit",
                      }}
                    />
                    {/* 비디오 없을 때 아바타 fallback */}
                    <div className="opponent-avatar" style={{ position: "relative", zIndex: 1 }}>🦊</div>
                    <div className="call-topbar">
                      <div className="opponent-info">
                        <div className="opponent-pic">🦊</div>
                        <div>
                          <div className="opponent-name">{activePeer?.name ?? "익명"}</div>
                          <div className="opponent-tag">아시아 · 상관없음</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className="call-live-timer" style={{ color: "#34d399" }}>{fmtTimer(callTimer)}</span>
                        <div className="call-action-btns">
                          <button className={`call-action-btn${isAddFriendLoading ? " btn-loading" : ""}`} onClick={addFriend} disabled={isAddFriendLoading}>👋 친구 추가</button>
                          <button className="call-action-btn" onClick={() => setReportOpen(true)}>🚨 신고</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="call-bottom">
                    <div className="call-center-btns">
                      <button className="next-match-btn" onClick={nextMatch}>다음 상대 →</button>
                      <div className="call-ctrl-row">
                        <div className={`call-ctrl-btn${micOff ? " off" : ""}`} onClick={() => setMicOff(m => !m)}>🎙️</div>
                        <button className="next-match-btn end-call" onClick={endCall}>통화 종료</button>
                        <div className={`call-ctrl-btn${camOff ? " off" : ""}`} onClick={() => setCamOff(c => !c)}>📷</div>
                      </div>
                    </div>
                    <div className="my-pip-wrap">
                      <div className="my-pip">
                        {/* 내 카메라 비디오 */}
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          style={{
                            width: "100%", height: "100%",
                            objectFit: "cover", borderRadius: "inherit",
                            position: "absolute", top: 0, left: 0,
                          }}
                        />
                        <div className="pip-inner" style={{ position: "relative", zIndex: 1 }}>{AVATARS[selectedAvatar].emoji}</div>
                        <div className="pip-label">나</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 대기 화면 */}
              {!matching && !inCall && (
                <>
                  <div className="cam-label">카메라 미리보기</div>
                  {/* 로컬 카메라 프리뷰 (대기 중) */}
                  <video
                    ref={el => { if (el && !inCall) localVideoRef.current = el }}
                    autoPlay playsInline muted
                    style={{
                      position: "absolute", inset: 0,
                      width: "100%", height: "100%",
                      objectFit: "cover", opacity: 0.25, borderRadius: "inherit",
                    }}
                  />
                  <div className="video-center" style={{ position: "relative", zIndex: 1 }}>
                    <div className="avatar-preview-ring">{AVATARS[selectedAvatar].emoji}</div>
                    <div className="avatar-status">아바타 활성화됨 · {AVATARS[selectedAvatar].name}</div>
                  </div>
                  <div className="video-controls">
                    <div className={`ctrl-btn${micOff ? " off" : ""}`} onClick={() => setMicOff(m => !m)}>🎙️</div>
                    <button className={`match-btn${isMatchingLoading ? " btn-loading" : ""}`} onClick={startMatching} disabled={isMatchingLoading}>
                      <span className="match-pulse" />
                      매칭 시작
                    </button>
                    <div className={`ctrl-btn${camOff ? " off" : ""}`} onClick={() => setCamOff(c => !c)}>📷</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={`modal-backdrop${paymentOpen ? " open" : ""}`} onClick={closePayment}>
        <div className="payment-modal" onClick={e => e.stopPropagation()}>
          <div className="plans-modal-header">
            <div className="plans-modal-title">결제하기</div>
            <button className="modal-close-btn" onClick={closePayment}>✕</button>
          </div>
          <div className="payment-item-info">
            <div className="payment-item-thumb">{paymentItem.thumb}</div>
            <div className="payment-item-detail">
              <div className="payment-item-name">{paymentItem.name}</div>
              <div className="payment-item-type">{paymentItem.type}</div>
            </div>
            <div className="payment-item-price">{paymentItem.price}</div>
          </div>
          <div className="pay-section-label">결제 수단</div>
          <div className="pay-method-row">
            <button className={`pay-method${payMethod === "card" ? " active" : ""}`} onClick={() => setPayMethod("card")}>신용카드</button>
            <button className={`pay-method${payMethod === "simple" ? " active" : ""}`} onClick={() => setPayMethod("simple")}>간편결제</button>
            <button className={`pay-method${payMethod === "virtual" ? " active" : ""}`} onClick={() => setPayMethod("virtual")}>가상계좌</button>
          </div>
          <div className="pay-total">
            <span className="pay-total-label">결제 금액</span>
            <span className="pay-total-val">{paymentItem.price}</span>
          </div>
          <button className={`pay-confirm-btn${isPaymentLoading ? " btn-loading" : ""}`} onClick={confirmPayment} disabled={isPaymentLoading}>결제하기</button>
        </div>
      </div>

      {/* 신고 모달 */}
      <div className={`modal-backdrop${reportOpen ? " open" : ""}`} onClick={() => setReportOpen(false)}>
        <div className="payment-modal" onClick={e => e.stopPropagation()}>
          <div className="plans-modal-header">
            <div className="plans-modal-title">신고하기</div>
            <button className="modal-close-btn" onClick={() => setReportOpen(false)}>✕</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "12px 0" }}>
            {[
              { value: "HARASSMENT", label: "욕설 / 괴롭힘" },
              { value: "NUDITY", label: "부적절한 노출" },
              { value: "SPAM", label: "스팸 / 광고" },
              { value: "HATE", label: "혐오 발언" },
              { value: "OTHER", label: "기타" },
            ].map(opt => (
              <div
                key={opt.value}
                onClick={() => setReportReason(opt.value)}
                style={{
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: `1px solid ${reportReason === opt.value ? "rgba(124,58,237,0.6)" : "var(--card-border)"}`,
                  background: reportReason === opt.value ? "rgba(124,58,237,0.1)" : "var(--card-bg)",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ color: reportReason === opt.value ? "#a78bfa" : "var(--text-dim)" }}>●</span>
                {opt.label}
              </div>
            ))}
          </div>
          <button className={`pay-confirm-btn${isReportLoading ? " btn-loading" : ""}`} onClick={submitReport} disabled={isReportLoading}>신고 접수</button>
        </div>
      </div>

      {/* 로딩 오버레이 */}
      {loadingProfile && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(5,5,10,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300,
        }}>
          <div style={{ color: "#a78bfa", fontSize: 14, fontWeight: 700 }}>불러오는 중...</div>
        </div>
      )}

      {/* 친구 요청 알림 */}
      {friendRequest && (
        <div style={{
          position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
          background: "rgba(15,10,35,0.97)", border: "1px solid rgba(124,58,237,0.5)",
          borderRadius: 16, padding: "16px 20px", zIndex: 400,
          display: "flex", flexDirection: "column", gap: 12, minWidth: 290,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>👋 친구 요청</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            <strong style={{ color: "#a78bfa" }}>{friendRequest.fromNickname}</strong>님이 친구 요청을 보냈습니다
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={async () => {
                await fetch("/api/friends", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ senderId: friendRequest.fromUserId, accepted: true }),
                })
                socketRef.current?.emit("friend:respond", {
                  targetSocketId: friendRequest.fromSocketId,
                  accepted: true,
                  responderNickname: (session?.user as any)?.name ?? "익명",
                })
                setFriendRequest(null)
                showToast("친구 요청을 수락했습니다!")
                const fr = await fetch("/api/friends")
                if (fr.ok) {
                  const d = await fr.json()
                  setFriends((d.friends ?? []).map((f: any) => ({ id: f.id, name: f.nickname ?? "익명", status: "온라인", online: true, emoji: "🙂", countryCode: f.countryCode, gender: f.gender })))
                }
              }}
              style={{ flex: 1, padding: "9px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >수락</button>
            <button
              onClick={async () => {
                await fetch("/api/friends", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ senderId: friendRequest.fromUserId, accepted: false }),
                })
                socketRef.current?.emit("friend:respond", {
                  targetSocketId: friendRequest.fromSocketId,
                  accepted: false,
                  responderNickname: (session?.user as any)?.name ?? "익명",
                })
                setFriendRequest(null)
                showToast("친구 요청을 거절했습니다")
              }}
              style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.1)", color: "#f87171", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >거절</button>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div className={`toast-enter toast-${toastType}`} style={{
          position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
          background: "rgba(30,20,50,0.95)", border: "1px solid rgba(124,58,237,0.4)",
          color: "#fff", padding: "10px 20px", borderRadius: 12, fontSize: 13,
          fontWeight: 600, zIndex: 400, whiteSpace: "nowrap",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}>
          {toast}
        </div>
      )}
    </>
  )
}
