// 파일 경로: src/app/main/components/VideoArea.tsx
import { useEffect, useState } from "react"
import type { ReactNode } from "react"

import { AVATARS, fmtTimer } from "../constants"

interface VideoAreaProps {
  inCall: boolean
  matching: boolean
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  localVideoRef: React.MutableRefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  remoteVideoRef: React.MutableRefObject<HTMLVideoElement | null>
  micOff: boolean
  camOff: boolean
  isFilterActive: boolean
  onToggleMic: () => void
  onToggleCam: () => void
  selectedAvatar: number
  activePeer: { id: string; name: string } | null
  callTimer: number
  onStartMatching: () => void
  onNextMatch: () => void
  onEndCall: () => void
  onOpenReport: () => void
  onAddFriend: () => void
  addFriendLabel: string
  addFriendState: "idle" | "pending" | "accepted"
  isAddFriendDisabled: boolean
  isCallTokenActive: boolean
  isMatchingLoading: boolean
  isAddFriendLoading: boolean
  matchingOverlay: ReactNode
}

export function VideoArea({
  inCall,
  matching,
  localStream,
  remoteStream,
  localVideoRef,
  canvasRef,
  remoteVideoRef,
  micOff,
  camOff,
  isFilterActive,
  onToggleMic,
  onToggleCam,
  selectedAvatar,
  activePeer,
  callTimer,
  onStartMatching,
  onNextMatch,
  onEndCall,
  onOpenReport,
  onAddFriend,
  addFriendLabel,
  addFriendState,
  isAddFriendDisabled,
  isCallTokenActive,
  isMatchingLoading,
  isAddFriendLoading,
  matchingOverlay,
}: VideoAreaProps) {
  const [isLocalVideoReady, setIsLocalVideoReady] = useState(false)
  const hasLocalVideo = Boolean(
    localStream?.getVideoTracks().some((track) => track.readyState === "live" && track.enabled)
  )
  const hasRemoteVideo = Boolean(
    remoteStream?.getVideoTracks().some((track) => track.readyState === "live")
  )

  useEffect(() => {
    const video = localVideoRef.current
    if (!video) return
    const resetVideoReadyState = () => {
      window.requestAnimationFrame(() => {
        setIsLocalVideoReady(false)
      })
    }

    if (!localStream) {
      resetVideoReadyState()
      video.srcObject = null
      return
    }

    const liveVideoTracks = localStream
      .getVideoTracks()
      .filter((track) => track.readyState === "live")

    if (liveVideoTracks.length === 0) {
      resetVideoReadyState()
      video.srcObject = null
      return
    }

    if (video.srcObject !== localStream) {
      video.srcObject = localStream
    }

    video.muted = true
    video.defaultMuted = true
    video.playsInline = true
    video.autoplay = true
    video.setAttribute("muted", "true")
    video.setAttribute("defaultMuted", "true")
    video.setAttribute("playsinline", "true")
    video.setAttribute("webkit-playsinline", "true")
    video.setAttribute("autoplay", "true")

    const syncVideoReadyState = () => {
      const isReady = video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0
      setIsLocalVideoReady(isReady)
      return isReady
    }

    const playVideo = async () => {
      try {
        await video.play()
      } catch {}
      syncVideoReadyState()
    }

    const handleCanPlay = () => {
      void playVideo()
    }

    video.addEventListener("loadedmetadata", handleCanPlay)
    video.addEventListener("loadeddata", handleCanPlay)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("playing", handleCanPlay)

    const retryTimer = window.setTimeout(() => {
      void playVideo()
    }, 180)

    void playVideo()

    return () => {
      window.clearTimeout(retryTimer)
      video.removeEventListener("loadedmetadata", handleCanPlay)
      video.removeEventListener("loadeddata", handleCanPlay)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("playing", handleCanPlay)
    }
  }, [localStream, inCall, matching, localVideoRef, camOff, isFilterActive])

  return (
    <div className="video-wrap">
      {matching && matchingOverlay}

      {inCall && (
        <div className="call-screen">
          <div className="call-opponent">
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
            {!hasRemoteVideo && <div className="opponent-avatar" style={{ position: "relative", zIndex: 1 }}>🦊</div>}
            <div className="call-topbar">
              <div className="opponent-info">
                <div className="opponent-pic">🦊</div>
                <div>
                  <div className="opponent-name">{activePeer?.name ?? "익명"}</div>
                  <div className="opponent-tag">아시아 · 상관없음</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className={`call-live-timer${isCallTokenActive ? " is-chargeable" : ""}`}>{fmtTimer(callTimer)}</span>
                <div className="call-action-btns">
                  <button
                    className={`call-action-btn friend-action-btn friend-action-${addFriendState}${isAddFriendLoading ? " btn-loading" : ""}`}
                    onClick={onAddFriend}
                    disabled={isAddFriendLoading || isAddFriendDisabled}
                  >
                    {addFriendLabel}
                  </button>
                  <button className="call-action-btn" onClick={onOpenReport}>🚨 신고</button>
                </div>
              </div>
            </div>
          </div>
          <div className="call-bottom">
            <div className="call-center-btns">
              <button className="next-match-btn" onClick={onNextMatch}>다음 상대 →</button>
              <div className="call-ctrl-row">
                <div className={`call-ctrl-btn${micOff ? " off" : ""}`} onClick={onToggleMic}>🎙️</div>
                <button className="next-match-btn end-call" onClick={onEndCall}>통화 종료</button>
                <div className={`call-ctrl-btn${camOff ? " off" : ""}`} onClick={onToggleCam}>📷</div>
              </div>
            </div>
            <div className="my-pip-wrap">
              <div className="my-pip">
                {isFilterActive && !camOff && (
                  <>
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: "100%", height: "100%",
                        objectFit: "cover", borderRadius: "inherit",
                        position: "absolute", top: 0, left: 0,
                        transform: "scaleX(-1)",
                        pointerEvents: "none",
                      }}
                    />
                    {isLocalVideoReady && (
                      <canvas
                        ref={canvasRef}
                        style={{
                          width: "100%", height: "100%",
                          objectFit: "cover", borderRadius: "inherit",
                          position: "absolute", top: 0, left: 0,
                          transform: "scaleX(-1)",
                        }}
                      />
                    )}
                  </>
                )}
                {!isFilterActive && !camOff && (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: "100%", height: "100%",
                      objectFit: "cover", borderRadius: "inherit",
                      position: "absolute", top: 0, left: 0,
                      transform: "scaleX(-1)",
                    }}
                  />
                )}
                {(!hasLocalVideo || camOff) && (
                  <div className="pip-inner" style={{ position: "relative", zIndex: 1 }}>{AVATARS[selectedAvatar].emoji}</div>
                )}
                <div className="pip-label">나</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!matching && !inCall && (
        <>
          {isFilterActive && !camOff && (
            <>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  position: "absolute", inset: 0,
                  width: "100%", height: "100%",
                  objectFit: "cover",
                  borderRadius: "inherit",
                  transform: "scaleX(-1)",
                  pointerEvents: "none",
                }}
              />
              {isLocalVideoReady && (
                <canvas
                  ref={canvasRef}
                  style={{
                    position: "absolute", inset: 0,
                    width: "100%", height: "100%",
                    objectFit: "cover",
                    borderRadius: "inherit",
                    transform: "scaleX(-1)",
                  }}
                />
              )}
            </>
          )}
          {!isFilterActive && !camOff && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                objectFit: "cover",
                borderRadius: "inherit",
                transform: "scaleX(-1)",
              }}
            />
          )}
          {camOff && (
            <div className="video-center" style={{ position: "relative", zIndex: 1 }}>
              <div className="avatar-preview-ring">{AVATARS[selectedAvatar].emoji}</div>
              <div className="avatar-status">아바타 활성화됨 · {AVATARS[selectedAvatar].name}</div>
            </div>
          )}
          <div className="video-controls">
            <div className={`ctrl-btn${micOff ? " off" : ""}`} onClick={onToggleMic}>🎙️</div>
            <button className={`match-btn${isMatchingLoading ? " btn-loading" : ""}`} onClick={onStartMatching} disabled={isMatchingLoading}>
              <span className="match-pulse" />
              매칭 시작
            </button>
            <div className={`ctrl-btn${camOff ? " off" : ""}`} onClick={onToggleCam}>📷</div>
          </div>
        </>
      )}
    </div>
  )
}
