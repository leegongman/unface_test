// 파일 경로: src/app/main/components/ChatView.tsx
interface ChatViewProps {
  chatView: { emoji: string; name: string }
  messages: Array<{ mine: boolean; text: string; time: string }>
  chatMsg: string
  onSetChatView: (view: { emoji: string; name: string } | null) => void
  onSetChatMsg: (value: string) => void
  onSendMsg: () => void
}

export function ChatView({
  chatView,
  messages,
  chatMsg,
  onSetChatView,
  onSetChatMsg,
  onSendMsg,
}: ChatViewProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div className="chat-header">
        <button className="chat-back-btn" onClick={() => onSetChatView(null)}>←</button>
        <div className="chat-peer-pic">{chatView.emoji}</div>
        <div style={{ flex: 1 }}>
          <div className="chat-peer-name">{chatView.name}</div>
          <div className="chat-peer-status">온라인</div>
        </div>
      </div>
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`msg-row${message.mine ? " mine" : ""}`}>
            {!message.mine && <div className="msg-avatar">{chatView.emoji}</div>}
            <div>
              <div className="msg-bubble">{message.text}</div>
            </div>
            <div className="msg-time">{message.time}</div>
          </div>
        ))}
      </div>
      <div className="chat-input-wrap">
        <input className="chat-input" placeholder="메시지 입력..." value={chatMsg} onChange={(event) => onSetChatMsg(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing) onSendMsg() }} />
        <button className="chat-send-btn" onClick={onSendMsg}>↑</button>
      </div>
    </div>
  )
}
