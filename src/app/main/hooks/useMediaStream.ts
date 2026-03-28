// 파일 경로: src/app/main/hooks/useMediaStream.ts
import { useCallback, useEffect, useRef, useState } from "react"

import type { PermissionError } from "../types"

interface UseMediaStreamParams {
  micOff: boolean
  camOff: boolean
  showToast: (msg: string, type?: "success" | "error" | "info") => void
}

interface UseMediaStreamReturn {
  localStream: MediaStream | null
  localStreamRef: React.MutableRefObject<MediaStream | null>
  localVideoRef: React.MutableRefObject<HTMLVideoElement | null>
  micOffRef: React.MutableRefObject<boolean>
  camOffRef: React.MutableRefObject<boolean>
  clearLocalStream: () => void
  prepareIdlePreview: () => Promise<MediaStream | null>
  ensureCallStream: () => Promise<MediaStream | null>
}

export function useMediaStream({
  micOff,
  camOff,
  showToast,
}: UseMediaStreamParams): UseMediaStreamReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const micOffRef = useRef(micOff)
  const camOffRef = useRef(camOff)

  const syncLocalTrackState = useCallback((stream: MediaStream) => {
    stream.getAudioTracks().forEach((track) => { track.enabled = !micOffRef.current })
    stream.getVideoTracks().forEach((track) => { track.enabled = !camOffRef.current })
  }, [])

  const clearLocalStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    localStreamRef.current = null
    setLocalStream(null)
  }, [])

  const prepareIdlePreview = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return null

    const existingStream = localStreamRef.current
    const hasLiveVideo = Boolean(
      existingStream?.getVideoTracks().some((track) => track.readyState === "live")
    )

    if (existingStream && hasLiveVideo) {
      syncLocalTrackState(existingStream)
      setLocalStream(existingStream)
      return existingStream
    }

    let stream: MediaStream | null = null
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      } catch {}
    }

    if (!stream) return null

    syncLocalTrackState(stream)
    localStreamRef.current = stream
    setLocalStream(stream)
    return stream
  }, [syncLocalTrackState])

  const ensureCallStream = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return null

    let stream = localStreamRef.current
    const hasLiveVideo = Boolean(
      stream?.getVideoTracks().some((track) => track.readyState === "live")
    )
    const hasLiveAudio = Boolean(
      stream?.getAudioTracks().some((track) => track.readyState === "live")
    )

    if (!stream || !hasLiveVideo) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      } catch (err: unknown) {
        const permissionError = err as PermissionError
        if (permissionError.name === "NotAllowedError" || permissionError.name === "PermissionDeniedError") {
          showToast("카메라/마이크 권한이 필요합니다. 브라우저 주소창 옆 자물쇠 아이콘에서 허용해주세요.", "error")
          return null
        }
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          } catch {
            return null
          }
        }
      }
    } else if (!hasLiveAudio) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        audioStream.getAudioTracks().forEach((track) => stream!.addTrack(track))
      } catch {}
    }

    if (!stream || stream.getTracks().length === 0) return null

    syncLocalTrackState(stream)
    localStreamRef.current = stream
    setLocalStream(stream)
    return stream
  }, [showToast, syncLocalTrackState])

  useEffect(() => {
    micOffRef.current = micOff
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !micOff })
  }, [micOff])

  useEffect(() => {
    camOffRef.current = camOff
    localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = !camOff })
  }, [camOff])

  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }
  }, [])

  return {
    localStream,
    localStreamRef,
    localVideoRef,
    micOffRef,
    camOffRef,
    clearLocalStream,
    prepareIdlePreview,
    ensureCallStream,
  }
}
