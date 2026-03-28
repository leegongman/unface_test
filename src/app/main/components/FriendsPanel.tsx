// 파일 경로: src/app/main/components/FriendsPanel.tsx
import { useState } from "react"

import type { MessagePreview } from "../types"
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
  chatView: { id: string; emoji: string; name: string } | null
  onSetChatView: (view: { id: string; emoji: string; name: string } | null) => void
  messages: Array<{ mine: boolean; text: string; time: string }>
  chatMsg: string
  onSetChatMsg: (value: string) => void
  onSendMsg: () => void
  onAcceptRequest: (requestId: string) => void | Promise<void>
  onRejectRequest: (requestId: string) => void | Promise<void>
  onShowToast: (message: string) => void
  onDeleteFriend: (friendId: string) => void
  friendPreviews: Record<string, MessagePreview>
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
  onDeleteFriend,
  friendPreviews,
}: FriendsPanelProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  return (
    <div
      className={`tab-overlay${isOpen ? " open" : ""}`}
      onClick={() => setOpenMenuId(null)}
    >
      {!chatView ? (
        <>
          <div className="overlay-header">
            친구 <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 500 }}>{friends.filter((f) => f.online).length}명 온라인</span>
          </div>
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
              ) : friends.map((friend, index) => {
                const preview = friendPreviews[friend.id]
                const hasUnread = (preview?.unreadCount ?? 0) > 0

                return (
                  <div
                    key={index}
                    onClick={() => { setOpenMenuId(null); onSetChatView(friend) }}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 16px", cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--list-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* 아바타 + 온라인 닷 */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: "50%",
                        background: "var(--card-bg)", border: "1px solid var(--card-border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22,
                      }}>{friend.emoji}</div>
                      <div style={{
                        position: "absolute", bottom: 1, right: 1,
                        width: 11, height: 11, borderRadius: "50%",
                        background: friend.online ? "var(--badge-online)" : "var(--badge-offline)",
                        border: "2px solid var(--sidebar-bg)",
                        boxShadow: friend.online ? "0 0 0 2px rgba(34,197,94,0.12)" : "none",
                      }} />
                    </div>

                    {/* 이름 + 마지막 대화 미리보기 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {friend.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-sub)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {preview?.lastMessage ? preview.lastMessage : (friend.online ? "온라인" : "오프라인")}
                      </div>
                    </div>

                    {/* 안읽음 뱃지 + "···" 메뉴 */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                      {hasUnread ? (
                        <div style={{
                          minWidth: 18, height: 18, borderRadius: 9,
                          background: "#ef4444", color: "#fff",
                          fontSize: 11, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          padding: "0 5px",
                        }}>
                          {preview.unreadCount > 99 ? "99+" : preview.unreadCount}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{friend.online ? "지금" : ""}</div>
                      )}

                      {/* "···" 더보기 버튼 */}
                      <div style={{ position: "relative" }}>
                        <button
                          className="f-btn"
                          style={{ width: 28, height: 28, fontSize: 16, letterSpacing: 1 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId(openMenuId === friend.id ? null : friend.id)
                          }}
                        >···</button>
                        {openMenuId === friend.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: "absolute", right: 0, top: 32, zIndex: 100,
                              background: "var(--card-bg)", border: "1px solid var(--card-border)",
                              borderRadius: 8, overflow: "hidden", minWidth: 150,
                              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                            }}
                          >
                            <div
                              style={{ padding: "10px 16px", fontSize: 13, cursor: "pointer", color: "var(--text-primary)" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--list-hover)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              onClick={() => { setOpenMenuId(null); onShowToast("준비 중이에요") }}
                            >📹 영상통화 하기</div>
                            <div
                              style={{ padding: "10px 16px", fontSize: 13, cursor: "pointer", color: "#ef4444", borderTop: "1px solid var(--card-border)" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--list-hover)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              onClick={() => { setOpenMenuId(null); onDeleteFriend(friend.id) }}
                            >🗑️ 친구 삭제하기</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
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
