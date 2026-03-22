// 파일 경로: src/app/main/components/ChatView.tsx
import { useEffect, useRef } from "react"

interface ChatViewProps {
  chatView: { id: string; emoji: string; name: string }
  messages: Array<{ mine: boolean; text: string; time: string }>
  chatMsg: string
  onSetChatView: (view: { id: string; emoji: string; name: string } | null) => void
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // 채팅창 처음 열릴 때 즉시 하단으로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
  }, [])

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
      <div className="chat-messages" ref={containerRef}>
        {messages.map((message, index) => (
          <div key={index} className={`msg-row${message.mine ? " mine" : ""}`}>
            {!message.mine && <div className="msg-avatar">{chatView.emoji}</div>}
            <div>
              <div className="msg-bubble">{message.text}</div>
            </div>
            <div className="msg-time">{message.time}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-wrap">
        <input className="chat-input" placeholder="메시지 입력..." value={chatMsg} onChange={(event) => onSetChatMsg(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing) onSendMsg() }} />
        <button className="chat-send-btn" onClick={onSendMsg}>↑</button>
      </div>
    </div>
  )
}
