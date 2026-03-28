// 파일 경로: src/app/main/hooks/useSocket.ts
import { useEffect } from "react"
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

    // 매칭 성사 — 서버가 isInitiator 결정
    socket.on("match:found", async (data: MatchFoundPayload) => {
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
      await startWebRTC(data.peerId, data.isInitiator)
    })

    // Offer 수신 (non-initiator 쪽)
    socket.on("webrtc:offer", async (data: WebRtcOfferPayload) => {
      await startWebRTC(data.from, false)
      const pc = peerConnectionRef.current!
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
      await drainIceBuffer(pc)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit("webrtc:answer", { targetId: data.from, sdp: pc.localDescription })
    })

    // Answer 수신 (initiator 쪽)
    socket.on("webrtc:answer", async (data: WebRtcAnswerPayload) => {
      const pc = peerConnectionRef.current
      if (!pc) return
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
      await drainIceBuffer(pc)
    })

    // ICE candidate — remote description 없으면 버퍼에 쌓기
    socket.on("webrtc:ice", async (data: WebRtcIcePayload) => {
      const pc = peerConnectionRef.current
      if (!pc || !data.candidate) return
      if (pc.remoteDescription) {
        try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)) } catch {}
      } else {
        iceCandidateBuffer.current.push(data.candidate)
      }
    })

    socket.on("call:ended", () => {
      const hasActiveCall = Boolean(activePeerSocketIdRef.current || peerConnectionRef.current)
      if (!hasActiveCall) return

      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
        callTimerRef.current = null
      }

      setCallTimer(0)
      showToast("상대방이 통화를 종료해 다음 상대를 찾고 있습니다", "info")
      rematchAfterCallEnd()
    })

    socket.on("message:receive", (data: { text: string; time: string }) => {
      const date = new Date(data.time)
      const hour = date.getHours()
      const time = hour >= 12
        ? `오후 ${hour - 12 || 12}:${String(date.getMinutes()).padStart(2, "0")}`
        : `오전 ${hour}:${String(date.getMinutes()).padStart(2, "0")}`
      setMessages((messages) => [...messages, { mine: false, text: data.text, time }])
    })

    // 친구 간 DM 수신
    socket.on("dm:receive", (data: { senderUserId: string; text: string; time: string }) => {
      const date = new Date(data.time)
      const hour = date.getHours()
      const time = hour >= 12
        ? `오후 ${hour - 12 || 12}:${String(date.getMinutes()).padStart(2, "0")}`
        : `오전 ${hour}:${String(date.getMinutes()).padStart(2, "0")}`
      onDmReceive(data.senderUserId, data.text, time)
    })

    socket.on("friend:incoming", (data: { fromSocketId: string; fromUserId: string; fromNickname: string }) => {
      setFriendRequest(data)
      onFriendIncoming()
    })

    socket.on("friend:response", (data: { accepted: boolean; responderNickname: string }) => {
      onFriendResponse()
      if (data.accepted) {
        showToast(`${data.responderNickname}님이 친구 요청을 수락했습니다!`)
      } else {
        showToast(`${data.responderNickname}님이 친구 요청을 거절했습니다`)
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [
    activePeerSocketIdRef,
    callTimerRef,
    iceCandidateBuffer,
    isMatchingRef,
    matchTimerRef,
    onDmReceive,
    peerConnectionRef,
    rematchAfterCallEnd,
    setActivePeer,
    setCallTimer,
    setFriendRequest,
    setInCall,
    setMatching,
    setMessages,
    showToast,
    socketRef,
    startWebRTC,
    onFriendIncoming,
    onFriendResponse,
  ])

  return {
    socketRef,
    activePeerSocketIdRef,
  }
}
