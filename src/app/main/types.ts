// 파일 경로: src/app/main/types.ts
export type ActivePanel = "avatar" | "voice" | "translate" | null
export type ActiveTab = "recent" | "friends"
export type AvatarTab = "basic" | "celeb" | "rpg"
export type VoiceTab = "morph" | "ai"

export type SubscriptionSummary = {
  name: string
  matchLimitDaily: number
  genderFilter: boolean
  voiceFilter: boolean
  translation: boolean
  premiumAvatars: boolean
}

export type ProfileSummary = {
  countryCode: string | null
  language: string | null
  gender: string | null
  serverRegions: string[]
  subscription: SubscriptionSummary | null
}

export type AvatarResponseItem = {
  id: string
  name: string
}

export type MeResponse = {
  countryCode?: string | null
  serverRegions?: string[]
  language?: string | null
  gender?: string | null
  preferGender?: string | null
  subscription?: SubscriptionSummary | null
  userAvatars?: Array<{ avatar?: { name?: string | null } | null }>
  equippedAvatar?: { name?: string | null } | null
  creditBalance?: number
}

export type CreditsResponse = {
  balance?: number
}

export type RecentCallRecord = {
  id: string
  durationSec: number | null
  peer: {
    nickname: string | null
    countryCode: string | null
  } | null
}

export type RecentCallsResponse = {
  calls?: RecentCallRecord[]
}

export type FriendRecord = {
  id: string
  nickname: string | null
  countryCode: string | null
  gender: string | null
}

export type FriendsResponse = {
  friends?: FriendRecord[]
}

export type FriendRequestsResponse = {
  received?: Array<{ id: string; sender: { id: string; nickname: string | null } }>
  sent?: Array<{ id: string; receiver: { id: string; nickname: string | null } }>
}

export type SocketTokenResponse = {
  token?: string
}

export type IceServersResponse = {
  iceServers?: RTCIceServer[]
}

export type CheckoutResponse = {
  url?: string
}

export type MatchFoundPayload = {
  peerId: string
  peerUserId: string
  peerNickname: string
  isInitiator: boolean
}

export type WebRtcOfferPayload = {
  from: string
  sdp: RTCSessionDescriptionInit
}

export type WebRtcAnswerPayload = {
  sdp: RTCSessionDescriptionInit
}

export type WebRtcIcePayload = {
  candidate: RTCIceCandidateInit | null
}

export type MessagePreview = {
  lastMessage: string
  lastTime: string
  unreadCount: number
}

export type PermissionError = Error & {
  name?: string
}
