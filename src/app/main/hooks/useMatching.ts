// 파일 경로: src/app/main/hooks/useMatching.ts
import { useCallback, useRef, useState } from "react"
import type { Session } from "next-auth"
import type { Socket } from "socket.io-client"

interface UseMatchingParams {
  socketRef: React.MutableRefObject<Socket | null>
  activePeerSocketIdRef: React.MutableRefObject<string | null>
  session: Session | null | undefined
  userProfile: { region: string; gender: string }
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

  const startMatching = useCallback(() => {
    if (isMatchingLoading || isMatchingRef.current) return
    setIsMatchingLoading(true)
    isMatchingRef.current = true
    setMatching(true)
    setMatchTimer(0)
    matchTimerRef.current = setInterval(() => setMatchTimer((seconds) => seconds + 1), 1000)
    socketRef.current?.emit("match:join", {
      userId: session?.user?.id ?? "unknown",
      nickname: session?.user?.name ?? session?.user?.nickname ?? "익명",
      region: userProfile.region,
      gender: userProfile.gender,
      preferGender: matchGenderPref,
    })
    setIsMatchingLoading(false)
  }, [isMatchingLoading, matchGenderPref, session, socketRef, userProfile.gender, userProfile.region])

  const cancelMatching = useCallback(() => {
    isMatchingRef.current = false
    setMatching(false)
    if (matchTimerRef.current) clearInterval(matchTimerRef.current)
    socketRef.current?.emit("match:cancel")
  }, [socketRef])

  const nextMatch = useCallback(() => {
    isMatchingRef.current = true
    socketRef.current?.emit("match:next", {
      userId: session?.user?.id ?? "unknown",
      nickname: session?.user?.name ?? session?.user?.nickname ?? "익명",
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
    matchTimerRef.current = setInterval(() => setMatchTimer((seconds) => seconds + 1), 1000)
  }, [
    activePeerSocketIdRef,
    cleanupWebRTC,
    matchGenderPref,
    session,
    setActivePeer,
    setInCall,
    socketRef,
    userProfile.gender,
    userProfile.region,
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
