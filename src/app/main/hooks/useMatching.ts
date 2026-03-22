// 파일 경로: src/app/main/hooks/useMatching.ts
import { useCallback, useRef, useState } from "react"
import type { Session } from "next-auth"
import type { Socket } from "socket.io-client"

interface UseMatchingParams {
  socketRef: React.MutableRefObject<Socket | null>
  activePeerSocketIdRef: React.MutableRefObject<string | null>
  session: Session | null | undefined
  userProfile: { regions: string[]; gender: string }
  matchGenderPref: string
  cleanupWebRTC: () => void
  setInCall: React.Dispatch<React.SetStateAction<boolean>>
  setActivePeer: React.Dispatch<React.SetStateAction<{ id: string; name: string } | null>>
}

interface UseMatchingReturn {
  matching: boolean
  setMatching: React.Dispatch<React.SetStateAction<boolean>>
  matchTimer: number
  matchTimerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>
  isMatchingLoading: boolean
  isMatchingRef: React.MutableRefObject<boolean>
  startMatching: () => void
  cancelMatching: () => void
  nextMatch: () => void
}

export function useMatching({
  socketRef,
  activePeerSocketIdRef,
  session,
  userProfile,
  matchGenderPref,
  cleanupWebRTC,
  setInCall,
  setActivePeer,
}: UseMatchingParams): UseMatchingReturn {
  const [matching, setMatching] = useState(false)
  const [matchTimer, setMatchTimer] = useState(0)
  const [isMatchingLoading, setIsMatchingLoading] = useState(false)
  const matchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isMatchingRef = useRef(false)

  const buildMatchPayload = useCallback(() => ({
    userId: session?.user?.id ?? "unknown",
    nickname: session?.user?.name ?? session?.user?.nickname ?? "익명",
    regions: userProfile.regions,
    gender: userProfile.gender,
    preferGender: matchGenderPref,
  }), [matchGenderPref, session, userProfile.gender, userProfile.regions])

  const beginMatchingState = useCallback(() => {
    if (matchTimerRef.current) {
      clearInterval(matchTimerRef.current)
    }

    setMatching(true)
    setMatchTimer(0)
    matchTimerRef.current = setInterval(() => setMatchTimer((seconds) => seconds + 1), 1000)
  }, [])

  const startMatching = useCallback(() => {
    if (isMatchingLoading || isMatchingRef.current) return
    setIsMatchingLoading(true)
    isMatchingRef.current = true
    beginMatchingState()
    socketRef.current?.emit("match:join", buildMatchPayload())
    setIsMatchingLoading(false)
  }, [beginMatchingState, buildMatchPayload, isMatchingLoading, socketRef])

  const cancelMatching = useCallback(() => {
    isMatchingRef.current = false
    setMatching(false)
    if (matchTimerRef.current) {
      clearInterval(matchTimerRef.current)
      matchTimerRef.current = null
    }
    socketRef.current?.emit("match:cancel")
  }, [socketRef])

  const nextMatch = useCallback(() => {
    isMatchingRef.current = true
    cleanupWebRTC()
    setInCall(false)
    setActivePeer(null)
    activePeerSocketIdRef.current = null
    beginMatchingState()
    socketRef.current?.emit("match:next", buildMatchPayload())
  }, [
    activePeerSocketIdRef,
    beginMatchingState,
    buildMatchPayload,
    cleanupWebRTC,
    setActivePeer,
    setInCall,
    socketRef,
  ])

  return {
    matching,
    setMatching,
    matchTimer,
    matchTimerRef,
    isMatchingLoading,
    isMatchingRef,
    startMatching,
    cancelMatching,
    nextMatch,
  }
}
