// 파일 경로: src/app/main/filters/avatars/DentalMaskFilter.ts
import { filterRegistry } from "../registry"
import type { FaceLandmarkerResult } from "../mediapipe"
import type { FaceBounds, FaceExpression, FaceFilter } from "../types"
import { toCanvasPx, landmarkDistance } from "../utils"

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function drawPerforationRow(
  ctx: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  y: number,
  radius: number,
  spacing: number
): void {
  for (let x = startX; x <= endX; x += spacing) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawPerforationColumn(
  ctx: CanvasRenderingContext2D,
  x: number,
  startY: number,
  endY: number,
  radius: number,
  spacing: number
): void {
  for (let y = startY; y <= endY; y += spacing) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawPleat(
  ctx: CanvasRenderingContext2D,
  width: number,
  y: number,
  depth: number,
  inset: number
): void {
  ctx.beginPath()
  ctx.moveTo(-width * 0.5 + inset, y)
  ctx.quadraticCurveTo(0, y + depth, width * 0.5 - inset, y)
  ctx.stroke()
}

export class DentalMaskFilter implements FaceFilter {
  readonly id = "dental-mask"
  readonly name = "흰색 마스크"
  readonly emoji = "😷"
  readonly category = "MASK" as const

  async init(): Promise<void> {}

  render(
    ctx: CanvasRenderingContext2D,
    result: FaceLandmarkerResult,
    expression: FaceExpression,
    _bounds: FaceBounds,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    const lm = result.faceLandmarks[0]
    if (!lm?.length) return

    const leftEyeInner = lm[33]
    const rightEyeInner = lm[263]
    const noseBridge = lm[6]
    const noseTip = lm[1]
    const chin = lm[152]
    const leftCheek = lm[234] ?? lm[93]
    const rightCheek = lm[454] ?? lm[323]
    const leftJaw = lm[172] ?? lm[136]
    const rightJaw = lm[397] ?? lm[365]
    const mouthLeft = lm[61]
    const mouthRight = lm[291]
    const mouthTop = lm[13]
    const mouthBottom = lm[14]

    if (
      !leftEyeInner ||
      !rightEyeInner ||
      !noseBridge ||
      !noseTip ||
      !chin ||
      !leftCheek ||
      !rightCheek ||
      !leftJaw ||
      !rightJaw ||
      !mouthLeft ||
      !mouthRight ||
      !mouthTop ||
      !mouthBottom
    ) {
      return
    }

    const W = canvasWidth
    const H = canvasHeight
    const eyeDist = landmarkDistance(leftEyeInner, rightEyeInner) * W
    if (eyeDist <= 0) return

    const leftCheekPx = toCanvasPx(leftCheek.x, leftCheek.y, W, H)
    const rightCheekPx = toCanvasPx(rightCheek.x, rightCheek.y, W, H)
    const leftJawPx = toCanvasPx(leftJaw.x, leftJaw.y, W, H)
    const rightJawPx = toCanvasPx(rightJaw.x, rightJaw.y, W, H)
    const noseBridgePx = toCanvasPx(noseBridge.x, noseBridge.y, W, H)
    const noseTipPx = toCanvasPx(noseTip.x, noseTip.y, W, H)
    const chinPx = toCanvasPx(chin.x, chin.y, W, H)
    const mouthLeftPx = toCanvasPx(mouthLeft.x, mouthLeft.y, W, H)
    const mouthRightPx = toCanvasPx(mouthRight.x, mouthRight.y, W, H)

    const faceWidth = Math.abs(rightCheekPx.x - leftCheekPx.x)
    const jawWidth = Math.abs(rightJawPx.x - leftJawPx.x)
    const mouthWidth = Math.abs(mouthRightPx.x - mouthLeftPx.x)
    const lowerFaceHeight = Math.abs(chinPx.y - noseBridgePx.y)
    const mouthCenterX = (mouthLeftPx.x + mouthRightPx.x) / 2
    const yawOffset = clamp(expression.headYaw / 45, -1, 1)
    const rollRad = expression.headRoll * (Math.PI / 180)

    const centerX = mouthCenterX + yawOffset * eyeDist * 0.04

    const maskWidth = Math.max(faceWidth * 1.02, jawWidth * 1.14, mouthWidth * 1.95, eyeDist * 2.08)
    const maskHeight = Math.max(
      lowerFaceHeight * (0.88 + expression.jawOpen * 0.16),
      eyeDist * 1.16
    )

    const topWidth = maskWidth * 0.92
    const bottomWidth = maskWidth * 0.74
    const topY = -maskHeight * 0.48
    const bottomY = maskHeight * 0.43
    const lowerCurveY = bottomY + maskHeight * 0.12
    const pleatInset = maskWidth * 0.1
    const topBandHeight = maskHeight * 0.12
    const dotRadius = Math.max(1, eyeDist * 0.012)
    const dotSpacing = Math.max(dotRadius * 3.1, eyeDist * 0.04)
    const targetTopWorldY = noseBridgePx.y * 0.38 + noseTipPx.y * 0.62
    const centerY = targetTopWorldY - (topY + maskHeight * 0.04)
    const leftLoopAnchorX = leftCheekPx.x - centerX - eyeDist * 0.18
    const rightLoopAnchorX = rightCheekPx.x - centerX + eyeDist * 0.18
    const leftLoopAnchorY =
      (leftCheekPx.y * 0.34 + leftJawPx.y * 0.18 + noseTipPx.y * 0.48) - centerY - eyeDist * 0.08
    const rightLoopAnchorY =
      (rightCheekPx.y * 0.34 + rightJawPx.y * 0.18 + noseTipPx.y * 0.48) - centerY - eyeDist * 0.08
    const upperAttachY = topY + maskHeight * 0.1
    const lowerAttachY = bottomY * 0.76

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(rollRad)

    ctx.save()
    ctx.strokeStyle = "rgba(148, 163, 184, 0.85)"
    ctx.lineWidth = Math.max(1.5, eyeDist * 0.028)
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(-topWidth * 0.48, upperAttachY)
    ctx.bezierCurveTo(
      -maskWidth * 0.68,
      topY - maskHeight * 0.04,
      leftLoopAnchorX - eyeDist * 0.08,
      leftLoopAnchorY - eyeDist * 0.08,
      leftLoopAnchorX,
      leftLoopAnchorY
    )
    ctx.bezierCurveTo(
      leftLoopAnchorX - eyeDist * 0.04,
      leftLoopAnchorY + eyeDist * 0.1,
      -maskWidth * 0.66,
      lowerAttachY + eyeDist * 0.04,
      -bottomWidth * 0.46,
      lowerAttachY
    )
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(topWidth * 0.48, upperAttachY)
    ctx.bezierCurveTo(
      maskWidth * 0.68,
      topY - maskHeight * 0.04,
      rightLoopAnchorX + eyeDist * 0.08,
      rightLoopAnchorY - eyeDist * 0.08,
      rightLoopAnchorX,
      rightLoopAnchorY
    )
    ctx.bezierCurveTo(
      rightLoopAnchorX + eyeDist * 0.04,
      rightLoopAnchorY + eyeDist * 0.1,
      maskWidth * 0.66,
      lowerAttachY + eyeDist * 0.04,
      bottomWidth * 0.46,
      lowerAttachY
    )
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.translate(0, maskHeight * 0.025)
    ctx.fillStyle = "rgba(15, 23, 42, 0.1)"
    ctx.beginPath()
    ctx.moveTo(-topWidth * 0.5, topY + maskHeight * 0.05)
    ctx.quadraticCurveTo(-maskWidth * 0.62, -maskHeight * 0.02, -bottomWidth * 0.48, bottomY * 0.78)
    ctx.quadraticCurveTo(0, lowerCurveY + maskHeight * 0.08, bottomWidth * 0.48, bottomY * 0.78)
    ctx.quadraticCurveTo(maskWidth * 0.62, -maskHeight * 0.02, topWidth * 0.5, topY + maskHeight * 0.05)
    ctx.quadraticCurveTo(0, topY - maskHeight * 0.05, -topWidth * 0.5, topY + maskHeight * 0.05)
    ctx.fill()
    ctx.restore()

    const bodyGradient = ctx.createLinearGradient(0, topY, 0, lowerCurveY)
    bodyGradient.addColorStop(0, "#ffffff")
    bodyGradient.addColorStop(0.42, "#f8fafc")
    bodyGradient.addColorStop(0.78, "#edf2f7")
    bodyGradient.addColorStop(1, "#e2e8f0")

    ctx.beginPath()
    ctx.moveTo(-topWidth * 0.5, topY + maskHeight * 0.03)
    ctx.quadraticCurveTo(-maskWidth * 0.62, -maskHeight * 0.03, -bottomWidth * 0.5, bottomY * 0.8)
    ctx.quadraticCurveTo(0, lowerCurveY, bottomWidth * 0.5, bottomY * 0.8)
    ctx.quadraticCurveTo(maskWidth * 0.62, -maskHeight * 0.03, topWidth * 0.5, topY + maskHeight * 0.03)
    ctx.quadraticCurveTo(0, topY - maskHeight * 0.05, -topWidth * 0.5, topY + maskHeight * 0.03)
    ctx.closePath()
    ctx.fillStyle = bodyGradient
    ctx.fill()

    const highlightGradient = ctx.createLinearGradient(
      -maskWidth * 0.26,
      topY + maskHeight * 0.08,
      maskWidth * 0.16,
      lowerCurveY
    )
    highlightGradient.addColorStop(0, "rgba(255,255,255,0.85)")
    highlightGradient.addColorStop(0.45, "rgba(255,255,255,0.18)")
    highlightGradient.addColorStop(1, "rgba(255,255,255,0)")
    ctx.fillStyle = highlightGradient
    ctx.fill()

    ctx.strokeStyle = "#cbd5e1"
    ctx.lineWidth = Math.max(1.5, eyeDist * 0.016)
    ctx.stroke()

    ctx.fillStyle = "rgba(255,255,255,0.72)"
    ctx.beginPath()
    ctx.moveTo(-topWidth * 0.48, topY + topBandHeight * 0.16)
    ctx.quadraticCurveTo(0, topY - topBandHeight * 0.22, topWidth * 0.48, topY + topBandHeight * 0.16)
    ctx.lineTo(topWidth * 0.44, topY + topBandHeight)
    ctx.quadraticCurveTo(0, topY + topBandHeight * 0.56, -topWidth * 0.44, topY + topBandHeight)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = "rgba(148, 163, 184, 0.65)"
    ctx.lineWidth = Math.max(1, eyeDist * 0.012)
    drawPleat(ctx, maskWidth * 0.72, topY + maskHeight * 0.28, maskHeight * 0.07, pleatInset)
    drawPleat(ctx, maskWidth * 0.66, topY + maskHeight * 0.5, maskHeight * 0.065, pleatInset * 1.1)
    drawPleat(ctx, maskWidth * 0.58, topY + maskHeight * 0.72, maskHeight * 0.06, pleatInset * 1.2)

    ctx.fillStyle = "rgba(148, 163, 184, 0.78)"
    drawPerforationRow(
      ctx,
      -topWidth * 0.42,
      topWidth * 0.42,
      topY + topBandHeight * 0.18,
      dotRadius,
      dotSpacing
    )
    drawPerforationRow(
      ctx,
      -topWidth * 0.42,
      topWidth * 0.42,
      topY + topBandHeight * 0.42,
      dotRadius,
      dotSpacing
    )
    drawPerforationRow(
      ctx,
      -bottomWidth * 0.4,
      bottomWidth * 0.4,
      lowerCurveY - maskHeight * 0.06,
      dotRadius,
      dotSpacing
    )

    drawPerforationColumn(
      ctx,
      -topWidth * 0.47,
      topY + topBandHeight * 0.28,
      bottomY * 0.72,
      dotRadius,
      dotSpacing * 0.9
    )
    drawPerforationColumn(
      ctx,
      topWidth * 0.47,
      topY + topBandHeight * 0.28,
      bottomY * 0.72,
      dotRadius,
      dotSpacing * 0.9
    )

    ctx.restore()
  }

  dispose(): void {}
}

filterRegistry.register(new DentalMaskFilter())
