// 파일 경로: src/app/main/components/StatusOverlays.tsx
interface FriendRequest {
  fromSocketId: string
  fromUserId: string
  fromNickname: string
}

interface LoadingOverlayProps {
  isOpen: boolean
}

interface FriendRequestToastProps {
  request: FriendRequest
  onAccept: () => void | Promise<void>
  onReject: () => void | Promise<void>
}

interface ToastMessageProps {
  message: string
  type: "success" | "error" | "info"
}

export function LoadingOverlay({ isOpen }: LoadingOverlayProps) {
  if (!isOpen) return null

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,5,10,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
      <div style={{ color: "#a78bfa", fontSize: 14, fontWeight: 700 }}>불러오는 중...</div>
    </div>
  )
}

export function FriendRequestToast({ request, onAccept, onReject }: FriendRequestToastProps) {
  return (
    <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "rgba(15,10,35,0.97)", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 16, padding: "16px 20px", zIndex: 400, display: "flex", flexDirection: "column", gap: 12, minWidth: 290, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>👋 친구 요청</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}><strong style={{ color: "#a78bfa" }}>{request.fromNickname}</strong>님이 친구 요청을 보냈습니다</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => void onAccept()} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>수락</button>
        <button onClick={() => void onReject()} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.1)", color: "#f87171", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>거절</button>
      </div>
    </div>
  )
}

export function ToastMessage({ message, type }: ToastMessageProps) {
  return (
    <div className={`toast-enter toast-${type}`} style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", background: "rgba(30,20,50,0.95)", border: "1px solid rgba(124,58,237,0.4)", color: "#fff", padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 400, whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
      {message}
    </div>
  )
}
