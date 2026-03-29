// 파일 경로: src/app/main/hooks/useSocket.ts
import { useEffect, useRef } from "react"
import type { Socket } from "socket.io-client"

import { getSocket } from "../../../lib/socket-client"
import type {
  MatchFoundPayload,
  SocketTokenResponse,
  WebRtcAnswerPayload,
  WebRtcIcePayload,
  WebRtcOfferPayload,
} from "../types"

interface UseSocketParams {
  socketRef: React.MutableRefObject<Socket | null>
  activePeerSocketIdRef: React.MutableRefObject<string | null>
  startWebRTC: (peerId: string, isInitiator: boolean) => Promise<void>
  rematchAfterCallEnd: () => void
  showToast: (msg: string, type?: "success" | "error" | "info") => void
  setInCall: React.Dispatch<React.SetStateAction<boolean>>
  setActivePeer: React.Dispatch<React.SetStateAction<{ id: string; name: string } | null>>
  setCallTimer: React.Dispatch<React.SetStateAction<number>>
  callTimerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>
  setMessages: React.Dispatch<React.SetStateAction<Array<{ mine: boolean; text: string; time: string }>>>
  setFriendRequest: React.Dispatch<
    React.SetStateAction<{ fromSocketId: string; fromUserId: string; fromNickname: string } | null>
  >
  iceCandidateBuffer: React.MutableRefObject<RTCIceCandidateInit[]>
  peerConnectionRef: React.MutableRefObject<RTCPeerConnection | null>
  setMatching: React.Dispatch<React.SetStateAction<boolean>>
  matchTimerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>
  isMatchingRef: React.MutableRefObject<boolean>
  onDmReceive: (senderUserId: string, text: string, time: string) => void
  onFriendIncoming: () => void
  onFriendResponse: () => void
}

interface UseSocketReturn {
  socketRef: React.MutableRefObject<Socket | null>
  activePeerSocketIdRef: React.MutableRefObject<string | null>
}

export function useSocket({
  socketRef,
  activePeerSocketIdRef,
  startWebRTC,
  rematchAfterCallEnd,
  showToast,
  setInCall,
  setActivePeer,
  setCallTimer,
  callTimerRef,
  setMessages,
  setFriendRequest,
  iceCandidateBuffer,
  peerConnectionRef,
  setMatching,
  matchTimerRef,
  isMatchingRef,
  onDmReceive,
  onFriendIncoming,
  onFriendResponse,
}: UseSocketParams): UseSocketReturn {
  // ──────────────────────────────────────────────────────────────
  // 핵심 수정: startWebRTC 등 콜백을 ref에 저장해서 useEffect의
  // 의존성 배열에서 제거합니다. 이렇게 하면 useEffect가 마운트 시
  // 한 번만 실행되어 소켓 리스너가 중복 등록되지 않습니다.
  // ──────────────────────────────────────────────────────────────
  const startWebRTCRef = useRef(startWebRTC)
  const rematchAfterCallEndRef = useRef(rematchAfterCallEnd)
  const showToastRef = useRef(showToast)
  const onDmReceiveRef = useRef(onDmReceive)
  const onFriendIncomingRef = useRef(onFriendIncoming)
  const onFriendResponseRef = useRef(onFriendResponse)

  // 매 렌더마다 ref를 최신 값으로 갱신
  useEffect(() => { startWebRTCRef.current = startWebRTC }, [startWebRTC])
  useEffect(() => { rematchAfterCallEndRef.current = rematchAfterCallEnd }, [rematchAfterCallEnd])
  useEffect(() => { showToastRef.current = showToast }, [showToast])
  useEffect(() => { onDmReceiveRef.current = onDmReceive }, [onDmReceive])
  useEffect(() => { onFriendIncomingRef.current = onFriendIncoming }, [onFriendIncoming])
  useEffect(() => { onFriendResponseRef.current = onFriendResponse }, [onFriendResponse])

  useEffect(() => {
    const setup = async () => {
      // 서버에서 서명된 소켓 인증 토큰 발급
      let token = ""
      try {
        const res = await fetch("/api/socket-token")
        if (res.ok) {
          const data: SocketTokenResponse = await res.json()
          token = data.token ?? ""
        }
      } catch {}

      const socket = getSocket()
      socket.auth = { token }
      socketRef.current = socket
      socket.connect()
    }

    setup()

    const socket = getSocket()

    // ICE candidate를 remote description 설정 후 드레인하는 헬퍼
    async function drainIceBuffer(pc: RTCPeerConnection) {
      for (const candidate of iceCandidateBuffer.current) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch {}
      }
      iceCandidateBuffer.current = []
    }

    // offer 처리 중 중복 진입 방지
    let isHandlingOffer = false

    // 매칭 성사 — 서버가 isInitiator 결정
    const onMatchFound = async (data: MatchFoundPayload) => {
      // 이미 취소된 매칭 요청의 stale 응답 무시
      if (!isMatchingRef.current) return
      isMatchingRef.current = false
      setMatching(false)
      if (matchTimerRef.current) clearInterval(matchTimerRef.current)
      setActivePeer({ id: data.peerUserId, name: data.peerNickname })
      activePeerSocketIdRef.current = data.peerId
      setInCall(true)
      if (callTimerRef.current) clearInterval(callTimerRef.current)
      setCallTimer(0)
      callTimerRef.current = setInterval(() => setCallTimer((seconds) => seconds + 1), 1000)
      // initiator만 여기서 PeerConnection 생성 + offer 전송
      // non-initiator는 webrtc:offer 수신 시 PC를 생성
      if (data.isInitiator) {
        await startWebRTCRef.current(data.peerId, true)
      }
    }

    // Offer 수신 (non-initiator 쪽)
    const onWebRtcOffer = async (data: WebRtcOfferPayload) => {
      if (isHandlingOffer) return
      isHandlingOffer = true

      try {
        await startWebRTCRef.current(data.from, false)
        const pc = peerConnectionRef.current
        if (!pc) return
        if (pc.signalingState !== "stable") return

        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
        await drainIceBuffer(pc)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit("webrtc:answer", { targetId: data.from, sdp: pc.localDescription })
      } catch (err) {
        console.error("[webrtc] offer handling failed", err)
      } finally {
        isHandlingOffer = false
      }
    }

    // Answer 수신 (initiator 쪽)
    const onWebRtcAnswer = async (data: WebRtcAnswerPayload) => {
      const pc = peerConnectionRef.current
      if (!pc) return
      if (pc.signalingState !== "have-local-offer") return
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
        await drainIceBuffer(pc)
      } catch (err) {
        console.error("[webrtc] answer handling failed", err)
      }
    }

    // ICE candidate — remote description 없으면 버퍼에 쌓기
    const onWebRtcIce = async (data: WebRtcIcePayload) => {
      const pc = peerConnectionRef.current
      if (!pc || !data.candidate) return
      if (pc.remoteDescription) {
        try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)) } catch {}
      } else {
        iceCandidateBuffer.current.push(data.candidate)
      }
    }

    const onCallEnded = () => {
      const hasActiveCall = Boolean(activePeerSocketIdRef.current || peerConnectionRef.current)
      if (!hasActiveCall) return

      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
        callTimerRef.current = null
      }

      setCallTimer(0)
      showToastRef.current("상대방이 통화를 종료해 다음 상대를 찾고 있습니다", "info")
      rematchAfterCallEndRef.current()
    }

    const onMessageReceive = (data: { text: string; time: string }) => {
      const date = new Date(data.time)
      const hour = date.getHours()
      const time = hour >= 12
        ? `오후 ${hour - 12 || 12}:${String(date.getMinutes()).padStart(2, "0")}`
        : `오전 ${hour}:${String(date.getMinutes()).padStart(2, "0")}`
      setMessages((messages) => [...messages, { mine: false, text: data.text, time }])
    }

    const onDmReceiveHandler = (data: { senderUserId: string; text: string; time: string }) => {
      const date = new Date(data.time)
      const hour = date.getHours()
      const time = hour >= 12
        ? `오후 ${hour - 12 || 12}:${String(date.getMinutes()).padStart(2, "0")}`
        : `오전 ${hour}:${String(date.getMinutes()).padStart(2, "0")}`
      onDmReceiveRef.current(data.senderUserId, data.text, time)
    }

    const onFriendIncomingHandler = (data: { fromSocketId: string; fromUserId: string; fromNickname: string }) => {
      setFriendRequest(data)
      onFriendIncomingRef.current()
    }

    const onFriendResponseHandler = (data: { accepted: boolean; responderNickname: string }) => {
      onFriendResponseRef.current()
      if (data.accepted) {
        showToastRef.current(`${data.responderNickname}님이 친구 요청을 수락했습니다!`)
      } else {
        showToastRef.current(`${data.responderNickname}님이 친구 요청을 거절했습니다`)
      }
    }

    socket.on("match:found", onMatchFound)
    socket.on("webrtc:offer", onWebRtcOffer)
    socket.on("webrtc:answer", onWebRtcAnswer)
    socket.on("webrtc:ice", onWebRtcIce)
    socket.on("call:ended", onCallEnded)
    socket.on("message:receive", onMessageReceive)
    socket.on("dm:receive", onDmReceiveHandler)
    socket.on("friend:incoming", onFriendIncomingHandler)
    socket.on("friend:response", onFriendResponseHandler)

    return () => {
      socket.off("match:found", onMatchFound)
      socket.off("webrtc:offer", onWebRtcOffer)
      socket.off("webrtc:answer", onWebRtcAnswer)
      socket.off("webrtc:ice", onWebRtcIce)
      socket.off("call:ended", onCallEnded)
      socket.off("message:receive", onMessageReceive)
      socket.off("dm:receive", onDmReceiveHandler)
      socket.off("friend:incoming", onFriendIncomingHandler)
      socket.off("friend:response", onFriendResponseHandler)
      socket.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // 의존성 배열을 빈 배열로 변경:
  // - 콜백들은 ref를 통해 항상 최신 값 참조
  // - ref 객체들(socketRef, peerConnectionRef 등)은 identity가 변하지 않음
  // - setter 함수들(setInCall 등)은 React가 안정적으로 보장
  // 이렇게 하면 useEffect가 마운트 시 1회만 실행되어
  // 소켓 리스너가 절대 중복 등록되지 않음

  return {
    socketRef,
    activePeerSocketIdRef,
  }
}
