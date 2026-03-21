// 파일 경로: src/app/main/page.tsx
"use client"
import "./main.css"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import type { Socket } from "socket.io-client"

import { AVATARS, CELEBS, getGenderLabel, getLanguageLabel, getLocationLabel, getRegionLabel, mapFriends, mapRecentCalls } from "./constants"
import { FriendsPanel } from "./components/FriendsPanel"
import { MatchingOverlay } from "./components/MatchingOverlay"
import { PaymentModal } from "./components/PaymentModal"
import { ProfileOverlay } from "./components/ProfileOverlay"
import { RecentCallsPanel } from "./components/RecentCallsPanel"
import { ReportModal } from "./components/ReportModal"
import { Sidebar } from "./components/Sidebar"
import { SlidePanel } from "./components/SlidePanel"
import { FriendRequestToast, LoadingOverlay, ToastMessage } from "./components/StatusOverlays"
import { TopBar } from "./components/TopBar"
import { VideoArea } from "./components/VideoArea"
import { useMatching } from "./hooks/useMatching"
import { useFaceFilter } from "./hooks/useFaceFilter"
import { useMediaStream } from "./hooks/useMediaStream"
import { useSocket } from "./hooks/useSocket"
import { useWebRTC } from "./hooks/useWebRTC"
import type { ActivePanel, ActiveTab, AvatarResponseItem, AvatarTab, CheckoutResponse, CreditsResponse, FriendRequestsResponse, FriendsResponse, MeResponse, ProfileSummary, RecentCallsResponse, VoiceTab } from "./types"

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
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null)
  const [selectedVoice, setSelectedVoice] = useState(0)
  const [selectedTranslate, setSelectedTranslate] = useState(0)
  const [micOff, setMicOff] = useState(false)
  const [camOff, setCamOff] = useState(false)
  const [inCall, setInCall] = useState(false)
  const [callTimer, setCallTimer] = useState(0)
  const [credits, setCredits] = useState(50)
  const [chatMsg, setChatMsg] = useState("")
  const [messages, setMessages] = useState<Array<{ mine: boolean; text: string; time: string }>>([
    { mine: false, text: "안녕하세요! 👋", time: "오후 2:14" },
    { mine: true, text: "안녕하세요~ 반가워요!", time: "오후 2:14" },
  ])
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentItem, setPaymentItem] = useState({ name: "고양이 아바타", type: "아바타", price: "$1", thumb: "🐱", priceValue: 1, itemType: "avatar", refName: "고양이", avatarCategory: "ANIMAL", creditAmount: 0, planName: "" })
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
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileSummary, setProfileSummary] = useState<ProfileSummary>({ countryCode: "AS", language: "ko", gender: "OTHER", subscription: null })
  const [friendRequest, setFriendRequest] = useState<{ fromSocketId: string; fromUserId: string; fromNickname: string } | null>(null)
  const [friendSubTab, setFriendSubTab] = useState<"list" | "received" | "sent">("list")
  const [receivedRequests, setReceivedRequests] = useState<Array<{ id: string; sender: { id: string; nickname: string | null } }>>([])
  const [sentRequests, setSentRequests] = useState<Array<{ id: string; receiver: { id: string; nickname: string | null } }>>([])
  const [userProfile, setUserProfile] = useState<{ region: string; gender: string }>({ region: "AS", gender: "OTHER" })
  const [isAddFriendLoading, setIsAddFriendLoading] = useState(false)
  const [isReportLoading, setIsReportLoading] = useState(false)
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info")
  const matchGenderPref = "OTHER"
  const socketRef = useRef<Socket | null>(null)
  const activePeerSocketIdRef = useRef<string | null>(null)
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const filteredStreamRef = useRef<MediaStream | null>(null)
  const cancelMatchingProxyRef = useRef<() => void>(() => {})
  const cleanupWebRTCProxyRef = useRef<() => void>(() => {})
  const showToast = useCallback((msg: string, type: "success" | "error" | "info" = "info") => { setToast(msg); setToastType(type); setTimeout(() => setToast(null), 3000) }, [])
  const callCancelMatching = useCallback(() => { cancelMatchingProxyRef.current() }, [])
  const callCleanupWebRTC = useCallback(() => { cleanupWebRTCProxyRef.current() }, [])
  const { localStream, localStreamRef, localVideoRef, clearLocalStream, prepareIdlePreview, ensureCallStream } = useMediaStream({ micOff, camOff, showToast })
  const { filteredStream, canvasRef, isFilterLoading } = useFaceFilter({ localVideoRef, localStreamRef, activeFilterId, onFilterError: useCallback(() => setActiveFilterId(null), []) })
  const { remoteStream, remoteVideoRef, peerConnectionRef, iceCandidateBuffer, startWebRTC, cleanupWebRTC } = useWebRTC({ ensureCallStream, showToast, cancelMatching: callCancelMatching, socketRef, localStreamRef, filteredStreamRef, clearLocalStream })
  const { matching, setMatching, matchTimer, matchTimerRef, isMatchingLoading, isMatchingRef, startMatching, cancelMatching, nextMatch } = useMatching({ socketRef, activePeerSocketIdRef, session, userProfile, matchGenderPref, cleanupWebRTC: callCleanupWebRTC, setInCall, setActivePeer })

  useEffect(() => { cancelMatchingProxyRef.current = cancelMatching }, [cancelMatching])
  useEffect(() => { cleanupWebRTCProxyRef.current = cleanupWebRTC }, [cleanupWebRTC])
  useEffect(() => { filteredStreamRef.current = filteredStream }, [filteredStream])
  useEffect(() => {
    if (session === null) router.push("/login")
  }, [session, router])
  useEffect(() => {
    const saved = localStorage.getItem("unface-theme") || "dark"
    setTheme(saved)
  }, [])
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("unface-theme", theme)
  }, [theme])
  useEffect(() => {
    if (selectedCeleb !== null) {
      setActiveFilterId(null)
      return
    }

    if (AVATARS[selectedAvatar]?.name === "고양이") {
      setActiveFilterId("cat")
      return
    }

    if (AVATARS[selectedAvatar]?.name === "흰색 마스크") {
      setActiveFilterId("dental-mask")
      return
    }

    if (AVATARS[selectedAvatar]?.name === "검정 마스크") {
      setActiveFilterId("black-dental-mask")
      return
    }

    setActiveFilterId(null)
  }, [selectedAvatar, selectedCeleb])
  useEffect(() => {
    if (!session) return
    const loadAll = async () => {
      setLoadingProfile(true)
      try {
        const [meRes, avatarsRes, creditsRes, callsRes, friendsRes, reqsRes] = await Promise.all([fetch("/api/users/me"), fetch("/api/avatars"), fetch("/api/credits"), fetch("/api/calls/recent"), fetch("/api/friends"), fetch("/api/friends/requests")])
        if (avatarsRes.ok) { const data: { avatars?: AvatarResponseItem[] } = await avatarsRes.json(); const map: Record<string, string> = {}; for (const avatar of data.avatars ?? []) map[avatar.name] = avatar.id; setAvatarIdByName(map) }
        if (meRes.ok) {
          const me: MeResponse = await meRes.json()
          setUserProfile({ region: me.countryCode ?? "AS", gender: me.gender ?? "OTHER" })
          setProfileSummary({ countryCode: me.countryCode ?? "AS", language: me.language ?? "ko", gender: me.gender ?? "OTHER", subscription: me.subscription ? { name: me.subscription.name, matchLimitDaily: me.subscription.matchLimitDaily, genderFilter: me.subscription.genderFilter, voiceFilter: me.subscription.voiceFilter, translation: me.subscription.translation, premiumAvatars: me.subscription.premiumAvatars } : null })
          const owned = new Set<string>(); for (const userAvatar of me.userAvatars ?? []) if (userAvatar.avatar?.name) owned.add(userAvatar.avatar.name); setOwnedAvatarNames(owned)
          const equippedAvatarName = me.equippedAvatar?.name
          if (equippedAvatarName) { const avatarIndex = AVATARS.findIndex((avatar) => avatar.name === equippedAvatarName); if (avatarIndex >= 0) { setSelectedAvatar(avatarIndex); setSelectedCeleb(null) } else { const celebIndex = CELEBS.findIndex((celeb) => celeb.name === equippedAvatarName); if (celebIndex >= 0) setSelectedCeleb(celebIndex) } }
          if (typeof me.creditBalance === "number") setCredits(me.creditBalance)
        }
        if (creditsRes.ok) { const credit: CreditsResponse = await creditsRes.json(); setCredits(credit.balance ?? 0) }
        if (callsRes.ok) { const data: RecentCallsResponse = await callsRes.json(); setRecentCalls(mapRecentCalls(data.calls ?? [])) }
        if (friendsRes.ok) { const data: FriendsResponse = await friendsRes.json(); setFriends(mapFriends(data.friends ?? [])) }
        if (reqsRes.ok) { const data: FriendRequestsResponse = await reqsRes.json(); setReceivedRequests(data.received ?? []); setSentRequests(data.sent ?? []) }
      } finally {
        setLoadingProfile(false)
      }
    }
    loadAll()
    window.addEventListener("focus", loadAll)
    return () => window.removeEventListener("focus", loadAll)
  }, [session])
  useEffect(() => {
    if (!session || inCall) return
    void prepareIdlePreview()
  }, [session, inCall, prepareIdlePreview])
  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
  }, [remoteStream, inCall, remoteVideoRef])
  useEffect(() => {
    if (!inCall) return

    const pc = peerConnectionRef.current
    const nextTrack = (filteredStreamRef.current ?? localStreamRef.current)?.getVideoTracks()[0] ?? null
    const videoSender = pc?.getSenders().find((sender) => sender.track?.kind === "video")
    if (!videoSender) return
    void videoSender.replaceTrack(nextTrack)
  }, [filteredStream, inCall, localStream, localStreamRef, peerConnectionRef])
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") { setReportOpen(false); setPaymentOpen(false); setProfileOpen(false) } }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (inCall) { event.preventDefault(); event.returnValue = "" } }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [inCall])

  const queueNextMatch = useCallback(() => {
    if (isMatchingRef.current) return

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
      callTimerRef.current = null
    }

    setCallTimer(0)
    nextMatch()
  }, [isMatchingRef, nextMatch])

  useSocket({ socketRef, activePeerSocketIdRef, startWebRTC, cleanupWebRTC, rematchAfterCallEnd: queueNextMatch, showToast, setInCall, setActivePeer, setCallTimer, callTimerRef, setMessages, setFriendRequest, iceCandidateBuffer, peerConnectionRef, setMatching, matchTimerRef, isMatchingRef })

  const togglePanel = (panel: ActivePanel) => { if (activePanel === panel) { setActivePanel(null); setTabOpen(false) } else { setActivePanel(panel); setTabOpen(false) } }
  const switchTab = (tab: ActiveTab) => { if (tabOpen && activeTab === tab) { setTabOpen(false); setChatView(null); return } setActiveTab(tab); setTabOpen(true); setActivePanel(null); setChatView(null) }
  const openPayment = (item: { name: string; type: string; price: string; thumb: string; priceValue: number; itemType: string; refName: string; avatarCategory?: string; creditAmount?: number; planName?: string }) => { setPaymentItem({ ...item, avatarCategory: item.avatarCategory ?? "", creditAmount: item.creditAmount ?? 0, planName: item.planName ?? "" }); setPaymentOpen(true) }
  const closePayment = () => setPaymentOpen(false)
  const confirmPayment = async () => {
    if (!session) { alert("로그인이 필요합니다"); return }
    if (isPaymentLoading) return
    setIsPaymentLoading(true)
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemName: paymentItem.name, price: paymentItem.priceValue, itemType: paymentItem.itemType, refName: paymentItem.refName, avatarCategory: paymentItem.avatarCategory, creditAmount: paymentItem.creditAmount, planName: paymentItem.planName, userId: session.user.id }) })
      const data: CheckoutResponse = await res.json()
      if (data.url) window.location.href = data.url
      else showToast("결제 준비 중 오류가 발생했습니다. 다시 시도해주세요.", "error")
    } finally {
      setIsPaymentLoading(false)
    }
  }
  const sendMsg = () => {
    if (!chatMsg.trim()) return
    const now = new Date()
    const time = now.getHours() >= 12 ? `오후 ${now.getHours() - 12 || 12}:${String(now.getMinutes()).padStart(2, "0")}` : `오전 ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`
    setMessages((current) => [...current, { mine: true, text: chatMsg, time }])
    socketRef.current?.emit("message:send", { text: chatMsg })
    setChatMsg("")
  }
  const addFriend = async () => {
    if (!activePeer || !activePeerSocketIdRef.current || isAddFriendLoading) return
    setIsAddFriendLoading(true)
    try {
      const res = await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: activePeer.id, autoAccept: false }) })
      if (res.ok) { socketRef.current?.emit("friend:request", { targetSocketId: activePeerSocketIdRef.current, fromUserId: session?.user?.id ?? "unknown", fromNickname: session?.user?.name ?? session?.user?.nickname ?? "익명" }); showToast("친구 요청을 보냈습니다!", "success") }
      else { const data = await res.json().catch(() => ({})); showToast(data.error ?? "친구 요청 실패", "error") }
    } finally {
      setIsAddFriendLoading(false)
    }
  }
  const submitReport = async () => {
    if (!activePeer || isReportLoading) return
    setIsReportLoading(true)
    try {
      await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetId: activePeer.id, reason: reportReason }) })
      setReportOpen(false)
      showToast("신고가 접수되었습니다", "success")
    } finally {
      setIsReportLoading(false)
    }
  }
  const endCall = () => {
    const peerId = activePeer?.id ?? null
    const durationSec = callTimer

    queueNextMatch()

    if (!peerId) return

    void (async () => {
      await fetch("/api/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ peerId, durationSec }) })
      const callsRes = await fetch("/api/calls/recent")
      if (callsRes.ok) { const data: RecentCallsResponse = await callsRes.json(); setRecentCalls(mapRecentCalls(data.calls ?? [])) }
    })()
  }
  const handleSelectAvatar = async (index: number) => {
    const avatar = AVATARS[index]
    setSelectedAvatar(index)
    setSelectedCeleb(null)
    const owned = ownedAvatarNames.has(avatar.name) || avatar.free
    if (!owned) return
    const avatarId = avatarIdByName[avatar.name]
    if (avatarId) await fetch("/api/avatars/equip", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatarId }) })
  }
  const handleSelectCeleb = async (index: number) => {
    const celeb = CELEBS[index]
    if (ownedAvatarNames.has(celeb.name)) {
      setSelectedCeleb(index)
      const avatarId = avatarIdByName[celeb.name]
      if (avatarId) await fetch("/api/avatars/equip", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatarId }) })
      return
    }
    openPayment({ name: `${celeb.name} 셀럽 AI`, type: "셀럽 AI", price: celeb.price, thumb: celeb.face, priceValue: 1, itemType: "celeb", refName: celeb.name, avatarCategory: "HUMAN" })
  }
  const handleAcceptRequest = async (requestId: string) => {
    const res = await fetch("/api/friends/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId }) })
    if (res.ok) {
      setReceivedRequests((current) => current.filter((request) => request.id !== requestId))
      const friendsRes = await fetch("/api/friends")
      if (friendsRes.ok) { const data: FriendsResponse = await friendsRes.json(); setFriends(mapFriends(data.friends ?? [])) }
      showToast("친구가 됐어요!")
    }
  }
  const handleRejectRequest = async (requestId: string) => {
    await fetch("/api/friends/reject", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId }) })
    setReceivedRequests((current) => current.filter((request) => request.id !== requestId))
    showToast("요청을 거절했어요")
  }
  const handleIncomingFriendAccept = async () => {
    if (!friendRequest) return
    await fetch("/api/friends", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ senderId: friendRequest.fromUserId, accepted: true }) })
    socketRef.current?.emit("friend:respond", { targetSocketId: friendRequest.fromSocketId, accepted: true, responderNickname: session?.user?.name ?? session?.user?.nickname ?? "익명" })
    setFriendRequest(null)
    showToast("친구 요청을 수락했습니다!")
    const friendsRes = await fetch("/api/friends")
    if (friendsRes.ok) { const data: FriendsResponse = await friendsRes.json(); setFriends(mapFriends(data.friends ?? [])) }
  }
  const handleIncomingFriendReject = async () => {
    if (!friendRequest) return
    await fetch("/api/friends", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ senderId: friendRequest.fromUserId, accepted: false }) })
    socketRef.current?.emit("friend:respond", { targetSocketId: friendRequest.fromSocketId, accepted: false, responderNickname: session?.user?.name ?? session?.user?.nickname ?? "익명" })
    setFriendRequest(null)
    showToast("친구 요청을 거절했습니다")
  }
  const nickname = session?.user?.name ?? session?.user?.nickname ?? "익명"
  const profileAvatar = selectedCeleb !== null ? (CELEBS[selectedCeleb]?.face ?? AVATARS[selectedAvatar]?.emoji ?? "😶") : (AVATARS[selectedAvatar]?.emoji ?? "😶")
  const currentLocationLabel = getLocationLabel(profileSummary.countryCode)
  const currentRegionLabel = getRegionLabel(profileSummary.countryCode)
  const currentLanguageLabel = getLanguageLabel(profileSummary.language)
  const currentGenderLabel = getGenderLabel(profileSummary.gender)
  const matchingGenderLabel = getGenderLabel(matchGenderPref)
  const planName = profileSummary.subscription ? `✦ ${profileSummary.subscription.name} 플랜` : "Free 플랜"
  const planDesc = profileSummary.subscription ? ["활성 플랜으로 프리미엄 기능을 사용할 수 있어요.", profileSummary.subscription.voiceFilter ? "AI 보이스 지원" : null, profileSummary.subscription.translation ? "자동 번역 지원" : null].filter(Boolean).join(" · ") : "기본 매칭과 기본 아바타를 사용할 수 있어요."
  const planBadge = profileSummary.subscription ? "사용 중" : "기본"
  const planFeatures = profileSummary.subscription ? [`${profileSummary.subscription.matchLimitDaily}회/일 매칭`, profileSummary.subscription.genderFilter ? "성별 필터" : null, profileSummary.subscription.voiceFilter ? "AI 보이스" : null, profileSummary.subscription.translation ? "자동 음성번역" : null, profileSummary.subscription.premiumAvatars ? "프리미엄 아바타" : null].filter((feature): feature is string => Boolean(feature)) : ["5회/일 매칭", "기본 아바타"]
  const isFilterActive = Boolean(activeFilterId) || isFilterLoading

  return (
    <>
      <div className={`app page-transition${profileOpen ? " hidden" : ""}`}>
        <Sidebar activePanel={activePanel} onTogglePanel={togglePanel} profileAvatar={profileAvatar} nickname={nickname} onOpenProfile={() => setProfileOpen(true)} onSignOut={() => signOut({ callbackUrl: "/login" })} onGoHome={() => router.push("/")} />
        <div className="main">
          <TopBar activeTab={activeTab} onSwitchTab={switchTab} receivedRequestsCount={receivedRequests.length} credits={credits} theme={theme} onToggleTheme={() => setTheme((value) => value === "dark" ? "light" : "dark")} onOpenPayment={openPayment} />
          <div className="content">
            <RecentCallsPanel isOpen={tabOpen && activeTab === "recent"} recentCalls={recentCalls} />
            <FriendsPanel isOpen={tabOpen && activeTab === "friends"} friends={friends} receivedRequests={receivedRequests} sentRequests={sentRequests} friendSubTab={friendSubTab} onSetFriendSubTab={setFriendSubTab} chatView={chatView} onSetChatView={setChatView} messages={messages} chatMsg={chatMsg} onSetChatMsg={setChatMsg} onSendMsg={sendMsg} onAcceptRequest={handleAcceptRequest} onRejectRequest={handleRejectRequest} onShowToast={showToast} />
            <SlidePanel activePanel={activePanel} avatarTab={avatarTab} onSetAvatarTab={setAvatarTab} voiceTab={voiceTab} onSetVoiceTab={setVoiceTab} selectedAvatar={selectedAvatar} onSelectAvatar={handleSelectAvatar} selectedCeleb={selectedCeleb} onSelectCeleb={handleSelectCeleb} selectedVoice={selectedVoice} onSelectVoice={setSelectedVoice} selectedTranslate={selectedTranslate} onSelectTranslate={setSelectedTranslate} ownedAvatarNames={ownedAvatarNames} onOpenPayment={openPayment} />
            <VideoArea inCall={inCall} matching={matching} localStream={localStream} remoteStream={remoteStream} localVideoRef={localVideoRef} canvasRef={canvasRef} remoteVideoRef={remoteVideoRef} micOff={micOff} camOff={camOff} isFilterActive={isFilterActive} onToggleMic={() => setMicOff((value) => !value)} onToggleCam={() => setCamOff((value) => !value)} selectedAvatar={selectedAvatar} activePeer={activePeer} callTimer={callTimer} onStartMatching={startMatching} onNextMatch={queueNextMatch} onEndCall={endCall} onOpenReport={() => setReportOpen(true)} onAddFriend={addFriend} isMatchingLoading={isMatchingLoading} isAddFriendLoading={isAddFriendLoading} matchingOverlay={<MatchingOverlay matchTimer={matchTimer} avatarEmoji={AVATARS[selectedAvatar].emoji} onCancel={cancelMatching} />} />
          </div>
        </div>
      </div>

      <ProfileOverlay isOpen={profileOpen} onClose={() => setProfileOpen(false)} profileAvatar={profileAvatar} nickname={nickname} profileSummary={profileSummary} currentLocationLabel={currentLocationLabel} currentRegionLabel={currentRegionLabel} currentLanguageLabel={currentLanguageLabel} currentGenderLabel={currentGenderLabel} matchingGenderLabel={matchingGenderLabel} planName={planName} planDesc={planDesc} planBadge={planBadge} planFeatures={planFeatures} onOpenAllPlans={() => { setProfileOpen(false); router.push("/shop") }} onEditProfile={() => { setProfileOpen(false); showToast("내 정보 변경 기능은 준비 중이에요") }} />
      <PaymentModal isOpen={paymentOpen} onClose={closePayment} paymentItem={paymentItem} payMethod={payMethod} onSetPayMethod={setPayMethod} onConfirm={confirmPayment} isLoading={isPaymentLoading} />
      <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} reportReason={reportReason} onSetReportReason={setReportReason} onSubmit={submitReport} isLoading={isReportLoading} />
      <LoadingOverlay isOpen={loadingProfile} />
      {friendRequest && <FriendRequestToast request={friendRequest} onAccept={handleIncomingFriendAccept} onReject={handleIncomingFriendReject} />}
      {toast && <ToastMessage message={toast} type={toastType} />}
    </>
  )
}
