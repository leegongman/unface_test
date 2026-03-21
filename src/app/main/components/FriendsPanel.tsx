// 파일 경로: src/app/main/components/FriendsPanel.tsx
import { ChatView } from "./ChatView"

interface FriendItem {
  id: string
  name: string
  status: string
  online: boolean
  emoji: string
  countryCode?: string
  gender?: string
}

interface FriendRequestItem {
  id: string
  sender: { id: string; nickname: string | null }
}

interface SentRequestItem {
  id: string
  receiver: { id: string; nickname: string | null }
}

interface FriendsPanelProps {
  isOpen: boolean
  friends: FriendItem[]
  receivedRequests: FriendRequestItem[]
  sentRequests: SentRequestItem[]
  friendSubTab: "list" | "received" | "sent"
  onSetFriendSubTab: (tab: "list" | "received" | "sent") => void
  chatView: { emoji: string; name: string } | null
  onSetChatView: (view: { emoji: string; name: string } | null) => void
  messages: Array<{ mine: boolean; text: string; time: string }>
  chatMsg: string
  onSetChatMsg: (value: string) => void
  onSendMsg: () => void
  onAcceptRequest: (requestId: string) => void | Promise<void>
  onRejectRequest: (requestId: string) => void | Promise<void>
  onShowToast: (message: string) => void
}

export function FriendsPanel({
  isOpen,
  friends,
  receivedRequests,
  sentRequests,
  friendSubTab,
  onSetFriendSubTab,
  chatView,
  onSetChatView,
  messages,
  chatMsg,
  onSetChatMsg,
  onSendMsg,
  onAcceptRequest,
  onRejectRequest,
  onShowToast,
}: FriendsPanelProps) {
  return (
    <div className={`tab-overlay${isOpen ? " open" : ""}`}>
      {!chatView ? (
        <>
          <div className="overlay-header">친구 <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 500 }}>{friends.filter((friend) => friend.online).length}명 온라인</span></div>
          <div className="friend-subtab-bar">
            <button className={`friend-subtab${friendSubTab === "list" ? " st-active" : ""}`} onClick={() => onSetFriendSubTab("list")}>친구 목록</button>
            <button className={`friend-subtab${friendSubTab === "received" ? " st-active" : ""}`} onClick={() => onSetFriendSubTab("received")}>
              받은 요청{receivedRequests.length > 0 && <span className="tab-badge">{receivedRequests.length}</span>}
            </button>
            <button className={`friend-subtab${friendSubTab === "sent" ? " st-active" : ""}`} onClick={() => onSetFriendSubTab("sent")}>보낸 요청</button>
          </div>

          {friendSubTab === "list" && (
            <div className="overlay-list" style={{ padding: "8px 0" }}>
              {friends.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🤝</div>
                  <div className="empty-state-text">아직 친구가 없어요.<br />통화하며 만난 사람에게<br />친구 추가해보세요!</div>
                </div>
              ) : friends.map((friend, index) => (
                <div
                  key={index}
                  onClick={() => onSetChatView(friend)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 16px", cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(event) => (event.currentTarget.style.background = "var(--list-hover)")}
                  onMouseLeave={(event) => (event.currentTarget.style.background = "transparent")}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: "50%",
                      background: "var(--card-bg)", border: "1px solid var(--card-border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22,
                    }}>{friend.emoji}</div>
                    {friend.online && (
                      <div style={{
                        position: "absolute", bottom: 1, right: 1,
                        width: 11, height: 11, borderRadius: "50%",
                        background: "var(--badge-online)",
                        border: "2px solid var(--sidebar-bg)",
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{friend.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-sub)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {friend.online ? "온라인" : "오프라인"}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{friend.online ? "지금" : ""}</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <div className="f-btn" style={{ width: 28, height: 28, fontSize: 13 }} onClick={(event) => { event.stopPropagation(); onSetChatView(friend) }}>💬</div>
                      <div className="f-btn call-btn" style={{ width: 28, height: 28, fontSize: 13 }} onClick={(event) => { event.stopPropagation(); onShowToast("준비 중이에요") }}>📹</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {friendSubTab === "received" && (
            <div className="overlay-list">
              {receivedRequests.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <div className="empty-state-text">받은 친구 요청이 없어요.</div>
                </div>
              ) : receivedRequests.map((request) => (
                <div key={request.id} className="req-item">
                  <div className="friend-avatar" style={{ width: 36, height: 36, fontSize: 16 }}>🙂</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="friend-name">{request.sender.nickname ?? "익명"}</div>
                  </div>
                  <div className="req-btns">
                    <button className="req-accept" onClick={() => void onAcceptRequest(request.id)}>수락</button>
                    <button className="req-reject" onClick={() => void onRejectRequest(request.id)}>거절</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {friendSubTab === "sent" && (
            <div className="overlay-list">
              {sentRequests.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📤</div>
                  <div className="empty-state-text">보낸 친구 요청이 없어요.</div>
                </div>
              ) : sentRequests.map((request) => (
                <div key={request.id} className="req-item">
                  <div className="friend-avatar" style={{ width: 36, height: 36, fontSize: 16 }}>🙂</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="friend-name">{request.receiver.nickname ?? "익명"}</div>
                  </div>
                  <span className="req-pending">대기 중...</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <ChatView
          chatView={chatView}
          messages={messages}
          chatMsg={chatMsg}
          onSetChatView={onSetChatView}
          onSetChatMsg={onSetChatMsg}
          onSendMsg={onSendMsg}
        />
      )}
    </div>
  )
}
