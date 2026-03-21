import "dotenv/config"
import { createServer } from "http"
import crypto from "crypto"
import { Server, type Socket } from "socket.io"

const httpServer = createServer()
const HOST = process.env.SOCKET_HOST ?? "0.0.0.0"
const PORT = Number(process.env.SOCKET_PORT ?? 3001)

const allowedOrigins = new Set(
  (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
)

const io = new Server(httpServer, {
  cors: {
    origin(origin, callback) {
      if (!origin) return callback(null, true)
      if (process.env.NODE_ENV !== "production") return callback(null, true)
      if (allowedOrigins.has(origin)) return callback(null, true)
      return callback(new Error("Origin not allowed"))
    },
    methods: ["GET", "POST"],
  },
})

interface QueueEntry {
  socketId: string
  userId: string
  nickname: string
  region: string
  gender: string
  preferGender?: string // 상대방 성별 필터 ("MALE" | "FEMALE" | "OTHER" | undefined = 상관없음)
}

const matchQueue: QueueEntry[] = []
const activeCalls: Map<string, string> = new Map() // socketId → partnerSocketId
const onlineUsers: Map<string, string> = new Map() // socketId → userId

interface MatchJoinPayload {
  userId: string
  nickname: string
  region: string
  gender: string
  preferGender?: string
}

interface WebRtcOfferPayload {
  targetId: string
  sdp: RTCSessionDescriptionInit
}

interface WebRtcIcePayload {
  targetId: string
  candidate: RTCIceCandidateInit
}

function handleMatchJoin(socket: Socket, data: MatchJoinPayload) {
  // 이미 대기 중이면 무시
  if (matchQueue.find((q) => q.socketId === socket.id)) return

  const entry: QueueEntry = { socketId: socket.id, ...data }

  // 매칭 조건: 지역 + 양방향 성별 필터 모두 충족하는 상대 찾기
  const isCompatible = (q: QueueEntry) => {
    if (q.socketId === socket.id) return false
    // 내가 원하는 상대 성별 체크
    if (data.preferGender && data.preferGender !== "OTHER" && q.gender !== data.preferGender) return false
    // 상대가 원하는 성별 체크 (상대의 필터도 만족해야 함)
    if (q.preferGender && q.preferGender !== "OTHER" && data.gender !== q.preferGender) return false
    return true
  }

  // 같은 지역 + 성별 조건 우선
  let matchIndex = matchQueue.findIndex((q) => isCompatible(q) && q.region === data.region)

  // 없으면 지역 무관 + 성별 조건
  if (matchIndex === -1) {
    matchIndex = matchQueue.findIndex((q) => isCompatible(q))
  }

  // 없으면 성별 조건 무시하고 아무나 (대기 최소화)
  if (matchIndex === -1) {
    matchIndex = matchQueue.findIndex((q) => q.socketId !== socket.id)
  }

  if (matchIndex !== -1) {
    const partner = matchQueue.splice(matchIndex, 1)[0]

    // 나중에 들어온 쪽(socket)이 initiator
    io.to(socket.id).emit("match:found", {
      peerId: partner.socketId,
      peerUserId: partner.userId,
      peerNickname: partner.nickname,
      isInitiator: true,
    })
    io.to(partner.socketId).emit("match:found", {
      peerId: socket.id,
      peerUserId: data.userId,
      peerNickname: data.nickname,
      isInitiator: false,
    })

    activeCalls.set(socket.id, partner.socketId)
    activeCalls.set(partner.socketId, socket.id)
  } else {
    matchQueue.push(entry)
    socket.emit("match:waiting", { position: matchQueue.length })
  }
}

// 소켓 연결 시 HMAC 서명된 토큰으로 userId 검증
io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined
  if (!token) return next(new Error("Authentication required"))

  const parts = token.split(":")
  if (parts.length !== 3) return next(new Error("Invalid token format"))

  const [userId, timestamp, sig] = parts
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) return next(new Error("Server misconfigured"))

  const payload = `${userId}:${timestamp}`
  const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex")

  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"))) {
      return next(new Error("Invalid token signature"))
    }
  } catch {
    return next(new Error("Invalid token"))
  }

  // 5분 이내 발급된 토큰만 허용
  if (Date.now() - Number(timestamp) > 5 * 60 * 1000) {
    return next(new Error("Token expired"))
  }

  socket.data.userId = userId
  next()
})

io.on("connection", (socket) => {
  console.log("Connected:", socket.id, "userId:", socket.data.userId)

  socket.on("match:join", (data) => {
    // 클라이언트가 보낸 userId 대신 서버에서 검증된 userId 사용
    const verifiedData = { ...data, userId: socket.data.userId }
    onlineUsers.set(socket.id, socket.data.userId)
    handleMatchJoin(socket, verifiedData)
  })

  socket.on("match:cancel", () => {
    const idx = matchQueue.findIndex((q) => q.socketId === socket.id)
    if (idx !== -1) matchQueue.splice(idx, 1)
  })

  socket.on("webrtc:offer", (data: WebRtcOfferPayload) => {
    io.to(data.targetId).emit("webrtc:offer", { from: socket.id, sdp: data.sdp })
  })

  socket.on("webrtc:answer", (data: WebRtcOfferPayload) => {
    io.to(data.targetId).emit("webrtc:answer", { from: socket.id, sdp: data.sdp })
  })

  socket.on("webrtc:ice", (data: WebRtcIcePayload) => {
    io.to(data.targetId).emit("webrtc:ice", { from: socket.id, candidate: data.candidate })
  })

  socket.on("call:end", () => {
    const partnerId = activeCalls.get(socket.id)
    if (partnerId) {
      io.to(partnerId).emit("call:ended")
      activeCalls.delete(socket.id)
      activeCalls.delete(partnerId)
    }
  })

  socket.on("message:send", (data: { text: string }) => {
    const partnerId = activeCalls.get(socket.id)
    if (partnerId) {
      io.to(partnerId).emit("message:receive", {
        text: data.text,
        time: new Date().toISOString(),
      })
    }
  })

  // 친구 요청 전달
  socket.on("friend:request", (data: { targetSocketId: string; fromUserId: string; fromNickname: string }) => {
    io.to(data.targetSocketId).emit("friend:incoming", {
      fromSocketId: socket.id,
      fromUserId: data.fromUserId,
      fromNickname: data.fromNickname,
    })
  })

  // 친구 요청 응답 전달
  socket.on("friend:respond", (data: { targetSocketId: string; accepted: boolean; responderNickname: string }) => {
    io.to(data.targetSocketId).emit("friend:response", {
      accepted: data.accepted,
      responderNickname: data.responderNickname,
    })
  })

  socket.on("match:next", (data: { userId: string; nickname: string; region: string; gender: string; preferGender?: string }) => {
    // 현재 통화 종료
    const partnerId = activeCalls.get(socket.id)
    if (partnerId) {
      io.to(partnerId).emit("call:ended")
      activeCalls.delete(socket.id)
      activeCalls.delete(partnerId)
    }
    // 새 상대 찾기 (검증된 userId 사용)
    handleMatchJoin(socket, { ...data, userId: socket.data.userId })
  })

  socket.on("friends:getOnline", (userIds: string[], callback: (onlineIds: string[]) => void) => {
    const onlineSet = new Set(onlineUsers.values())
    const result = userIds.filter(id => onlineSet.has(id))
    if (typeof callback === "function") callback(result)
  })

  socket.on("disconnect", () => {
    const idx = matchQueue.findIndex((q) => q.socketId === socket.id)
    if (idx !== -1) matchQueue.splice(idx, 1)

    onlineUsers.delete(socket.id)

    const partnerId = activeCalls.get(socket.id)
    if (partnerId) {
      io.to(partnerId).emit("call:ended")
      activeCalls.delete(socket.id)
      activeCalls.delete(partnerId)
    }

    console.log("Disconnected:", socket.id)
  })
})

httpServer.listen(PORT, HOST, () => {
  console.log(`Socket.io server running on http://${HOST}:${PORT}`)
})
