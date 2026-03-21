// 파일 경로: src/app/main/filters/types.ts
import type { FaceLandmarkerResult } from "./mediapipe"

export interface FaceExpression {
  eyeBlinkLeft: number
  eyeBlinkRight: number
  jawOpen: number
  mouthSmileLeft: number
  mouthSmileRight: number
  browDownLeft: number
  browDownRight: number
  browInnerUp: number
  headYaw: number
  headPitch: number
  headRoll: number
}

export interface FaceBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface FaceFilter {
  readonly id: string
  readonly name: string
  readonly emoji: string
  readonly category: "ANIMAL" | "HUMAN" | "MASK"
  init(): Promise<void>
  render(
    ctx: CanvasRenderingContext2D,
    result: FaceLandmarkerResult,
    expression: FaceExpression,
    bounds: FaceBounds,
    canvasWidth: number,
    canvasHeight: number
  ): void
  dispose(): void
}
