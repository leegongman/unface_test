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
  regions: string[]
  gender: string
  preferGender?: string // 상대방 성별 필터 ("MALE" | "FEMALE" | "OTHER" | undefined = 상관없음)
}

const matchQueue: QueueEntry[] = []
const activeCalls: Map<string, string> = new Map() // socketId → partnerSocketId
const onlineUsers: Map<string, string> = new Map() // socketId → userId
const userSockets: Map<string, string> = new Map() // userId → socketId (최신 연결)
const presenceSubscriptions: Map<string, Set<string>> = new Map() // socketId -> watched friend userIds

interface MatchJoinPayload {
  userId: string
  nickname: string
  regions: string[]
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

function getOnlineUserIds() {
  return new Set(onlineUsers.values())
}

function emitPresenceSnapshot(socket: Socket) {
  const watchedUserIds = presenceSubscriptions.get(socket.id)
  if (!watchedUserIds || watchedUserIds.size === 0) {
    socket.emit("friends:presence", { onlineIds: [] })
    return
  }

  const onlineUserIds = getOnlineUserIds()
  const onlineIds = Array.from(watchedUserIds).filter((userId) => onlineUserIds.has(userId))
  socket.emit("friends:presence", { onlineIds })
}

function broadcastPresenceUpdate(userId: string) {
  const onlineUserIds = getOnlineUserIds()
  const isOnline = onlineUserIds.has(userId)

  for (const [socketId, watchedUserIds] of presenceSubscriptions.entries()) {
    if (!watchedUserIds.has(userId)) continue

    io.to(socketId).emit("friends:presence:update", {
      userId,
      online: isOnline,
    })
  }
}

function normalizeServerRegion(region: string | undefined): string {
  const normalized = region?.trim().toUpperCase()

  switch (normalized) {
    case "북아메리카":
      return "NA"
    case "남아메리카":
      return "SA"
    case "유럽":
      return "EU"
    case "아프리카":
      return "AF"
    case "아시아":
      return "AS"
    case "오세아니아":
      return "OC"
    case "NA":
    case "SA":
    case "EU":
    case "AF":
    case "AS":
    case "OC":
      return normalized
    default:
      return "AS"
  }
}

function removeQueueEntry(socketId: string) {
  const idx = matchQueue.findIndex((q) => q.socketId === socketId)
  if (idx !== -1) matchQueue.splice(idx, 1)
}

function handleMatchJoin(socket: Socket, data: MatchJoinPayload) {
  removeQueueEntry(socket.id)

  const normalizedRegions = (data.regions ?? ["AS"]).map(normalizeServerRegion)
  const entry: QueueEntry = {
    socketId: socket.id,
    ...data,
    regions: normalizedRegions,
  }

  // 매칭 조건: 서버 대륙 배열 교집합 존재 + 양방향 성별 필터 모두 충족하는 상대 찾기
  const isCompatible = (q: QueueEntry) => {
    if (q.socketId === socket.id) return false
    // 서버 대륙 교집합 체크 (최소 1개 공통 지역 필요)
    const hasCommonRegion = q.regions.some((r) => normalizedRegions.includes(r))
    if (!hasCommonRegion) return false
    // 내가 원하는 상대 성별 체크
    if (data.preferGender && data.preferGender !== "OTHER" && q.gender !== data.preferGender) return false
    // 상대가 원하는 성별 체크 (상대의 필터도 만족해야 함)
    if (q.preferGender && q.preferGender !== "OTHER" && data.gender !== q.preferGender) return false
    return true
  }

  const matchIndex = matchQueue.findIndex((q) => isCompatible(q))

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

  // 연결 즉시 userId ↔ socketId 등록 (DM 수신을 위해)
  if (socket.data.userId) {
    onlineUsers.set(socket.id, socket.data.userId)
    userSockets.set(socket.data.userId, socket.id)
    broadcastPresenceUpdate(socket.data.userId)
  }

  socket.on("match:join", (data) => {
    // 클라이언트가 보낸 userId 대신 서버에서 검증된 userId 사용
    const verifiedData = { ...data, userId: socket.data.userId }
    handleMatchJoin(socket, verifiedData)
  })

  socket.on("match:cancel", () => {
    removeQueueEntry(socket.id)
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

  socket.on("match:next", (data: { userId: string; nickname: string; regions: string[]; gender: string; preferGender?: string }) => {
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

  // 친구 간 다이렉트 메시지 릴레이
  socket.on("dm:send", (data: { receiverUserId: string; text: string }) => {
    const receiverSocketId = userSockets.get(data.receiverUserId)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("dm:receive", {
        senderUserId: socket.data.userId,
        text: data.text,
        time: new Date().toISOString(),
      })
    }
  })

  socket.on("friends:subscribePresence", (userIds: string[] = []) => {
    const watchedUserIds = new Set(
      userIds
        .filter((userId): userId is string => typeof userId === "string")
        .map((userId) => userId.trim())
        .filter(Boolean)
    )

    if (watchedUserIds.size === 0) {
      presenceSubscriptions.delete(socket.id)
      socket.emit("friends:presence", { onlineIds: [] })
      return
    }

    presenceSubscriptions.set(socket.id, watchedUserIds)
    emitPresenceSnapshot(socket)
  })

  socket.on("friends:getOnline", (userIds: string[], callback: (onlineIds: string[]) => void) => {
    const onlineSet = new Set(onlineUsers.values())
    const result = userIds.filter(id => onlineSet.has(id))
    if (typeof callback === "function") callback(result)
  })

  socket.on("disconnect", () => {
    removeQueueEntry(socket.id)

    presenceSubscriptions.delete(socket.id)
    onlineUsers.delete(socket.id)
    if (socket.data.userId && userSockets.get(socket.data.userId) === socket.id) {
      userSockets.delete(socket.data.userId)
    }
    if (socket.data.userId) {
      broadcastPresenceUpdate(socket.data.userId)
    }

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
