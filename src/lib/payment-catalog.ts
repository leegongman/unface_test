// 변경 이유: 프론트에서 보내는 결제 요청을 서버 소유 상품 카탈로그로 해석해 Stripe 금액과 지급 대상을 안전하게 통제하기 위해 추가했습니다.
import type { AvatarCategory } from "@prisma/client"

export type CheckoutRequest = {
  productKey?: string
  itemType?: string
  refName?: string
  planName?: string
  creditAmount?: number
  itemName?: string
  price?: number
  userId?: string
  avatarCategory?: string
}

export type CatalogProduct = {
  key: string
  itemType: "plan" | "credit" | "avatar" | "celeb"
  name: string
  description: string
  unitAmount: number
  refName: string
  avatarCategory?: AvatarCategory
  creditAmount?: number
  planName?: string
  durationDays?: number
  isPremium?: boolean
}

const PRODUCT_CATALOG: Record<string, CatalogProduct> = {
  "plan:pro_30d": {
    key: "plan:pro_30d",
    itemType: "plan",
    name: "Pro 30일권",
    description: "30일 동안 Pro 기능을 이용할 수 있는 일회성 상품",
    unitAmount: 100,
    refName: "Pro",
    planName: "Pro",
    durationDays: 30,
  },
  "credits:50": {
    key: "credits:50",
    itemType: "credit",
    name: "통화 크레딧 50회",
    description: "통화 크레딧 50회를 충전합니다",
    unitAmount: 100,
    refName: "credits",
    creditAmount: 50,
  },
  "avatar:기본": {
    key: "avatar:기본",
    itemType: "avatar",
    name: "기본 아바타",
    description: "기본 아바타를 계정에 추가합니다",
    unitAmount: 100,
    refName: "기본",
    avatarCategory: "MASK",
    isPremium: false,
  },
  "avatar:고양이": {
    key: "avatar:고양이",
    itemType: "avatar",
    name: "고양이 아바타",
    description: "고양이 아바타를 계정에 추가합니다",
    unitAmount: 100,
    refName: "고양이",
    avatarCategory: "ANIMAL",
    isPremium: false,
  },
  "avatar:여우": {
    key: "avatar:여우",
    itemType: "avatar",
    name: "여우 아바타",
    description: "여우 아바타를 계정에 추가합니다",
    unitAmount: 100,
    refName: "여우",
    avatarCategory: "ANIMAL",
    isPremium: false,
  },
  "avatar:로봇": {
    key: "avatar:로봇",
    itemType: "avatar",
    name: "로봇 아바타",
    description: "로봇 아바타를 계정에 추가합니다",
    unitAmount: 100,
    refName: "로봇",
    avatarCategory: "MASK",
    isPremium: false,
  },
  "avatar:문어": {
    key: "avatar:문어",
    itemType: "avatar",
    name: "문어 아바타",
    description: "문어 아바타를 계정에 추가합니다",
    unitAmount: 100,
    refName: "문어",
    avatarCategory: "ANIMAL",
    isPremium: false,
  },
  "avatar:사자": {
    key: "avatar:사자",
    itemType: "avatar",
    name: "사자 아바타",
    description: "사자 아바타를 계정에 추가합니다",
    unitAmount: 100,
    refName: "사자",
    avatarCategory: "ANIMAL",
    isPremium: false,
  },
  "avatar:에일리언": {
    key: "avatar:에일리언",
    itemType: "avatar",
    name: "에일리언 아바타",
    description: "에일리언 아바타를 계정에 추가합니다",
    unitAmount: 100,
    refName: "에일리언",
    avatarCategory: "MASK",
    isPremium: false,
  },
  "avatar:호박": {
    key: "avatar:호박",
    itemType: "avatar",
    name: "호박 아바타",
    description: "호박 아바타를 계정에 추가합니다",
    unitAmount: 100,
    refName: "호박",
    avatarCategory: "MASK",
    isPremium: false,
  },
  "avatar:곰인형": {
    key: "avatar:곰인형",
    itemType: "avatar",
    name: "곰인형 아바타",
    description: "곰인형 아바타를 계정에 추가합니다",
    unitAmount: 100,
    refName: "곰인형",
    avatarCategory: "ANIMAL",
    isPremium: false,
  },
  "avatar:호랑이 아바타": {
    key: "avatar:호랑이 아바타",
    itemType: "avatar",
    name: "호랑이 아바타",
    description: "호랑이 아바타를 계정에 추가합니다",
    unitAmount: 399,
    refName: "호랑이 아바타",
    avatarCategory: "ANIMAL",
    isPremium: false,
  },
  "avatar:여우 아바타": {
    key: "avatar:여우 아바타",
    itemType: "avatar",
    name: "여우 아바타",
    description: "여우 아바타를 계정에 추가합니다",
    unitAmount: 299,
    refName: "여우 아바타",
    avatarCategory: "ANIMAL",
    isPremium: false,
  },
  "avatar:미스터리 가면": {
    key: "avatar:미스터리 가면",
    itemType: "avatar",
    name: "미스터리 가면",
    description: "미스터리 가면 아바타를 계정에 추가합니다",
    unitAmount: 499,
    refName: "미스터리 가면",
    avatarCategory: "MASK",
    isPremium: false,
  },
  "avatar:로봇 아바타": {
    key: "avatar:로봇 아바타",
    itemType: "avatar",
    name: "로봇 아바타",
    description: "로봇 아바타를 계정에 추가합니다",
    unitAmount: 599,
    refName: "로봇 아바타",
    avatarCategory: "MASK",
    isPremium: false,
  },
  "celeb:장원영": {
    key: "celeb:장원영",
    itemType: "celeb",
    name: "장원영 셀럽 AI",
    description: "장원영 셀럽 AI 아바타를 계정에 추가합니다",
    unitAmount: 100,
    refName: "장원영",
    avatarCategory: "HUMAN",
    isPremium: true,
  },
  "celeb:뷔": {
    key: "celeb:뷔",
    itemType: "celeb",
    name: "뷔 셀럽 AI",
    description: "뷔 셀럽 AI 아바타를 계정에 추가합니다",
    unitAmount: 100,
    refName: "뷔",
    avatarCategory: "HUMAN",
    isPremium: true,
  },
  "celeb:카리나": {
    key: "celeb:카리나",
    itemType: "celeb",
    name: "카리나 셀럽 AI",
    description: "카리나 셀럽 AI 아바타를 계정에 추가합니다",
    unitAmount: 100,
    refName: "카리나",
    avatarCategory: "HUMAN",
    isPremium: true,
  },
  "celeb:차은우": {
    key: "celeb:차은우",
    itemType: "celeb",
    name: "차은우 셀럽 AI",
    description: "차은우 셀럽 AI 아바타를 계정에 추가합니다",
    unitAmount: 100,
    refName: "차은우",
    avatarCategory: "HUMAN",
    isPremium: true,
  },
  "celeb:윈터": {
    key: "celeb:윈터",
    itemType: "celeb",
    name: "윈터 셀럽 AI",
    description: "윈터 셀럽 AI 아바타를 계정에 추가합니다",
    unitAmount: 100,
    refName: "윈터",
    avatarCategory: "HUMAN",
    isPremium: true,
  },
  "celeb:지민": {
    key: "celeb:지민",
    itemType: "celeb",
    name: "지민 셀럽 AI",
    description: "지민 셀럽 AI 아바타를 계정에 추가합니다",
    unitAmount: 100,
    refName: "지민",
    avatarCategory: "HUMAN",
    isPremium: true,
  },
}

export function getCatalogProduct(productKey: string): CatalogProduct | null {
  return PRODUCT_CATALOG[productKey] ?? null
}

export function resolveProductKeyFromCheckout(body: CheckoutRequest): string | null {
  if (typeof body.productKey === "string" && body.productKey in PRODUCT_CATALOG) {
    return body.productKey
  }

  if (body.itemType === "plan" && (body.planName === "Pro" || body.refName === "Pro")) {
    return "plan:pro_30d"
  }

  if (body.itemType === "credit" && Number(body.creditAmount) === 50) {
    return "credits:50"
  }

  if ((body.itemType === "avatar" || body.itemType === "celeb") && typeof body.refName === "string") {
    const key = `${body.itemType}:${body.refName}`
    return key in PRODUCT_CATALOG ? key : null
  }

  return null
}

export function resolveProductFromMetadata(metadata: Record<string, string>): CatalogProduct | null {
  if (metadata.productKey) {
    return PRODUCT_CATALOG[metadata.productKey] ?? null
  }

  const legacyKey = resolveProductKeyFromCheckout({
    itemType: metadata.itemType,
    refName: metadata.refName,
    planName: metadata.planName,
    creditAmount: Number(metadata.creditAmount || 0),
  })

  return legacyKey ? PRODUCT_CATALOG[legacyKey] : null
}

export function getCheckoutItemName(metadata: Record<string, string>): string {
  const product = resolveProductFromMetadata(metadata)
  if (product) return product.name

  if (metadata.itemType === "credit") {
    const amount = Number(metadata.creditAmount || 0)
    return amount > 0 ? `크레딧 ${amount}개` : "크레딧"
  }

  if (metadata.planName) return metadata.planName
  return metadata.refName ?? ""
}
