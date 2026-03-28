// 파일 경로: src/app/main/hooks/useWebRTC.ts
import { useCallback, useRef, useState } from "react"
import type { Socket } from "socket.io-client"

import type { IceServersResponse } from "../types"

interface UseWebRTCParams {
  ensureCallStream: () => Promise<MediaStream | null>
  showToast: (msg: string, type?: "success" | "error" | "info") => void
  cancelMatching: () => void
  socketRef: React.MutableRefObject<Socket | null>
  localStreamRef: React.MutableRefObject<MediaStream | null>
  filteredStreamRef: React.MutableRefObject<MediaStream | null>
  clearLocalStream: () => void
}

interface UseWebRTCReturn {
  remoteStream: MediaStream | null
  remoteVideoRef: React.MutableRefObject<HTMLVideoElement | null>
  peerConnectionRef: React.MutableRefObject<RTCPeerConnection | null>
  iceCandidateBuffer: React.MutableRefObject<RTCIceCandidateInit[]>
  startWebRTC: (peerId: string, isInitiator: boolean) => Promise<void>
  cleanupWebRTC: () => void
}

export function useWebRTC({
  ensureCallStream,
  showToast,
  cancelMatching,
  socketRef,
  localStreamRef,
  filteredStreamRef,
  clearLocalStream,
}: UseWebRTCParams): UseWebRTCReturn {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const iceCandidateBuffer = useRef<RTCIceCandidateInit[]>([])
  const remoteStreamRef = useRef<MediaStream | null>(null)

  const resetPeerConnection = useCallback(() => {
    const existingPeerConnection = peerConnectionRef.current
    if (existingPeerConnection) {
      existingPeerConnection.ontrack = null
      existingPeerConnection.onicecandidate = null
      existingPeerConnection.onconnectionstatechange = null
      existingPeerConnection.oniceconnectionstatechange = null
      existingPeerConnection.close()
    }

    peerConnectionRef.current = null
    iceCandidateBuffer.current = []
    remoteStreamRef.current = null
    setRemoteStream(null)
  }, [])

  const cleanupWebRTC = useCallback(() => {
    resetPeerConnection()
    clearLocalStream()
  }, [clearLocalStream, resetPeerConnection])

  const startWebRTC = useCallback(async (peerId: string, isInitiator: boolean) => {
    const socket = socketRef.current
    if (!socket) return

    // 메인 진입 시 띄운 프리뷰 스트림을 우선 재사용
    const stream = await ensureCallStream()
    if (!stream) {
      showToast("카메라 또는 마이크를 사용할 수 없습니다. 장치를 확인해주세요.", "error")
      cancelMatching()
      return
    }
    localStreamRef.current = stream

    // ICE 서버 목록 (TURN 포함) 서버에서 조회
    let iceServers: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ]

    try {
      const res = await fetch("/api/ice-servers")
      if (res.ok) {
        const data: IceServersResponse = await res.json()
        if (data.iceServers?.length) iceServers = data.iceServers
      }
    } catch {}

    resetPeerConnection()

    const pc = new RTCPeerConnection({ iceServers })
    peerConnectionRef.current = pc
    remoteStreamRef.current = null
    setRemoteStream(null)

    const hasLiveFilteredVideo = Boolean(
      filteredStreamRef.current?.getVideoTracks().some((track) => track.readyState === "live")
    )
    const streamToSend = hasLiveFilteredVideo ? filteredStreamRef.current : localStreamRef.current
    streamToSend?.getVideoTracks().forEach((track) => pc.addTrack(track, streamToSend))

    if (localStreamRef.current && streamToSend !== localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!))
    } else {
      localStreamRef.current?.getAudioTracks().forEach((track) => {
        if (!pc.getSenders().some((sender) => sender.track?.id === track.id)) pc.addTrack(track, localStreamRef.current!)
      })
    }

    // 상대방 스트림 수신 — state로 저장해 useEffect가 video에 연결
    pc.ontrack = (event) => {
      const existingTracks = remoteStreamRef.current?.getTracks() ?? []
      const hasTrack = existingTracks.some((track) => track.id === event.track.id)
      const nextTracks = hasTrack ? existingTracks : [...existingTracks, event.track]
      const nextRemoteStream = new MediaStream(nextTracks)

      remoteStreamRef.current = nextRemoteStream
      setRemoteStream(nextRemoteStream)

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = nextRemoteStream
        void remoteVideoRef.current.play().catch(() => {})
      }

      console.info("[webrtc] remote track received", {
        peerId,
        kind: event.track.kind,
      })
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc:ice", { targetId: peerId, candidate: event.candidate.toJSON() })
      }
    }

    pc.onconnectionstatechange = () => {
      console.info("[webrtc] connection state changed", {
        peerId,
        state: pc.connectionState,
      })
    }

    pc.oniceconnectionstatechange = () => {
      console.info("[webrtc] ice connection state changed", {
        peerId,
        state: pc.iceConnectionState,
      })
    }

    if (isInitiator) {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket.emit("webrtc:offer", { targetId: peerId, sdp: pc.localDescription })
    }
  }, [cancelMatching, ensureCallStream, filteredStreamRef, localStreamRef, remoteVideoRef, resetPeerConnection, showToast, socketRef])

  return {
    remoteStream,
    remoteVideoRef,
    peerConnectionRef,
    iceCandidateBuffer,
    startWebRTC,
    cleanupWebRTC,
  }
}
