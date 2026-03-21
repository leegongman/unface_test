// 파일 경로: src/app/main/filters/utils.ts
import type { FaceLandmark, FaceLandmarkerResult } from "./mediapipe"
import type { FaceBounds, FaceExpression } from "./types"

const DEFAULT_EXPRESSION: FaceExpression = {
  eyeBlinkLeft: 0,
  eyeBlinkRight: 0,
  jawOpen: 0,
  mouthSmileLeft: 0,
  mouthSmileRight: 0,
  browDownLeft: 0,
  browDownRight: 0,
  browInnerUp: 0,
  headYaw: 0,
  headPitch: 0,
  headRoll: 0,
}

function getBlendshapeScore(result: FaceLandmarkerResult, name: string): number {
  const categories = result.faceBlendshapes[0]?.categories ?? []
  return categories.find((category) => category.categoryName === name)?.score ?? 0
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function parseExpression(result: FaceLandmarkerResult): FaceExpression {
  const landmarks = result.faceLandmarks[0]
  if (!landmarks?.length) return DEFAULT_EXPRESSION

  const bounds = parseFaceBounds(result)
  const leftEye = landmarks[33]
  const rightEye = landmarks[263]
  const noseTip = landmarks[1] ?? landmarks[4]

  let headRoll = 0
  let headYaw = 0
  let headPitch = 0

  if (leftEye && rightEye) {
    headRoll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI)
  }

  if (noseTip && bounds.width > 0 && bounds.height > 0) {
    const offsetX = (noseTip.x - bounds.x) / (bounds.width / 2)
    const offsetY = (noseTip.y - bounds.y) / (bounds.height / 2)
    headYaw = clamp(offsetX * 35, -45, 45)
    headPitch = clamp(offsetY * -25, -30, 30)
  }

  return {
    eyeBlinkLeft: getBlendshapeScore(result, "eyeBlinkLeft"),
    eyeBlinkRight: getBlendshapeScore(result, "eyeBlinkRight"),
    jawOpen: getBlendshapeScore(result, "jawOpen"),
    mouthSmileLeft: getBlendshapeScore(result, "mouthSmileLeft"),
    mouthSmileRight: getBlendshapeScore(result, "mouthSmileRight"),
    browDownLeft: getBlendshapeScore(result, "browDownLeft"),
    browDownRight: getBlendshapeScore(result, "browDownRight"),
    browInnerUp: getBlendshapeScore(result, "browInnerUp"),
    headYaw,
    headPitch,
    headRoll,
  }
}

export function parseFaceBounds(result: FaceLandmarkerResult): FaceBounds {
  const landmarks = result.faceLandmarks[0]
  if (!landmarks?.length) {
    return { x: 0.5, y: 0.5, width: 0, height: 0 }
  }

  let minX = 1
  let minY = 1
  let maxX = 0
  let maxY = 0

  for (const landmark of landmarks) {
    minX = Math.min(minX, landmark.x)
    minY = Math.min(minY, landmark.y)
    maxX = Math.max(maxX, landmark.x)
    maxY = Math.max(maxY, landmark.y)
  }

  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    width: maxX - minX,
    height: maxY - minY,
  }
}

export function toCanvasPx(
  normalizedX: number,
  normalizedY: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  return {
    x: normalizedX * canvasWidth,
    y: normalizedY * canvasHeight,
  }
}

export function landmarkDistance(
  lm1: Pick<FaceLandmark, "x" | "y">,
  lm2: Pick<FaceLandmark, "x" | "y">
): number {
  return Math.hypot(lm2.x - lm1.x, lm2.y - lm1.y)
}
