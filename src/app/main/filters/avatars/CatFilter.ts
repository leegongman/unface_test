// 파일 경로: src/app/main/filters/avatars/CatFilter.ts
import { filterRegistry } from "../registry"
import type { FaceLandmarkerResult } from "../mediapipe"
import type { FaceBounds, FaceExpression, FaceFilter } from "../types"
import { toCanvasPx, landmarkDistance } from "../utils"

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getBlendshapeScore(result: FaceLandmarkerResult, name: string): number {
  const categories = result.faceBlendshapes[0]?.categories ?? []
  return categories.find((category) => category.categoryName === name)?.score ?? 0
}

function drawEar(ctx: CanvasRenderingContext2D, side: -1 | 1, radius: number): void {
  const earBaseX = side * radius * 0.56
  const earBaseY = -radius * 0.74
  const earW = radius * 0.42
  const earH = radius * 0.56

  const earGrad = ctx.createLinearGradient(
    earBaseX,
    earBaseY - earH,
    earBaseX + side * earW * 0.34,
    earBaseY + earH * 0.1
  )
  earGrad.addColorStop(0, "#e8a800")
  earGrad.addColorStop(0.55, "#ffd426")
  earGrad.addColorStop(1, "#c87800")

  ctx.fillStyle = earGrad
  ctx.beginPath()
  ctx.moveTo(earBaseX - side * earW * 0.56, earBaseY + radius * 0.06)
  ctx.lineTo(earBaseX + side * earW * 0.56, earBaseY + radius * 0.06)
  ctx.lineTo(earBaseX + side * earW * 0.18, earBaseY - earH)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = "rgba(154, 85, 0, 0.18)"
  ctx.beginPath()
  ctx.moveTo(earBaseX - side * earW * 0.1, earBaseY - earH * 0.72)
  ctx.lineTo(earBaseX + side * earW * 0.48, earBaseY + earH * 0.02)
  ctx.lineTo(earBaseX + side * earW * 0.18, earBaseY - earH * 0.08)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = "#fff9c4"
  ctx.globalAlpha = 0.76
  ctx.beginPath()
  ctx.moveTo(earBaseX - side * earW * 0.28, earBaseY)
  ctx.lineTo(earBaseX + side * earW * 0.28, earBaseY)
  ctx.lineTo(earBaseX + side * earW * 0.1, earBaseY - earH * 0.62)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = "rgba(255,255,255,0.9)"
  ctx.beginPath()
  ctx.moveTo(0, -size)
  ctx.lineTo(size * 0.3, -size * 0.3)
  ctx.lineTo(size, 0)
  ctx.lineTo(size * 0.3, size * 0.3)
  ctx.lineTo(0, size)
  ctx.lineTo(-size * 0.3, size * 0.3)
  ctx.lineTo(-size, 0)
  ctx.lineTo(-size * 0.3, -size * 0.3)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawEye(
  ctx: CanvasRenderingContext2D,
  eyeX: number,
  eyeY: number,
  radius: number,
  blink: number,
  isSurprised: boolean,
  isWink: boolean
): void {
  const eyeRX = radius * 0.148
  const baseEyeRY = radius * (isSurprised ? 0.215 : 0.188)
  const currentEyeRY = baseEyeRY * (1 - blink * 0.9)

  if (blink > 0.6) {
    ctx.strokeStyle = "#0d0d0d"
    ctx.lineWidth = radius * 0.038
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(eyeX - eyeRX * 0.92, eyeY + radius * 0.015)
    ctx.quadraticCurveTo(eyeX, eyeY + eyeRX * 0.34, eyeX + eyeRX * 0.92, eyeY + radius * 0.015)
    ctx.stroke()

    if (isWink) {
      for (const lashOffset of [-0.26, 0, 0.26] as const) {
        ctx.beginPath()
        ctx.moveTo(eyeX + lashOffset * eyeRX, eyeY - radius * 0.01)
        ctx.lineTo(eyeX + lashOffset * eyeRX, eyeY - radius * 0.1 - Math.abs(lashOffset) * radius * 0.03)
        ctx.stroke()
      }
    }

    return
  }

  const eyeGlow = ctx.createRadialGradient(
    eyeX - eyeRX * 0.3,
    eyeY - currentEyeRY * 0.25,
    0,
    eyeX,
    eyeY,
    eyeRX * 1.45
  )
  eyeGlow.addColorStop(0, "rgba(255,255,255,0.2)")
  eyeGlow.addColorStop(1, "rgba(255,255,255,0)")
  ctx.fillStyle = eyeGlow
  ctx.beginPath()
  ctx.ellipse(eyeX, eyeY, eyeRX * 1.28, currentEyeRY * 1.28, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = "#0d0d0d"
  ctx.beginPath()
  ctx.ellipse(eyeX, eyeY, eyeRX, currentEyeRY, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = "rgba(255,255,255,0.92)"
  ctx.beginPath()
  ctx.ellipse(
    eyeX - eyeRX * 0.28,
    eyeY - currentEyeRY * 0.36,
    eyeRX * 0.28,
    currentEyeRY * 0.23,
    -0.45,
    0,
    Math.PI * 2
  )
  ctx.fill()

  ctx.fillStyle = "rgba(255,255,255,0.3)"
  ctx.beginPath()
  ctx.ellipse(
    eyeX + eyeRX * 0.18,
    eyeY + currentEyeRY * 0.18,
    eyeRX * 0.11,
    currentEyeRY * 0.12,
    0,
    0,
    Math.PI * 2
  )
  ctx.fill()
}

export class CatFilter implements FaceFilter {
  readonly id = "cat"
  readonly name = "고양이"
  readonly emoji = "🐱"
  readonly category = "ANIMAL" as const

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
    const leftEyeCenter = lm[468] ?? leftEyeInner
    const rightEyeCenter = lm[473] ?? rightEyeInner
    const forehead = lm[10]
    const chin = lm[152]
    const leftCheek = lm[234]
    const rightCheek = lm[454]
    const nose = lm[1]
    const mouthTop = lm[13]
    const mouthBottom = lm[14]
    const mouthLeft = lm[61]
    const mouthRight = lm[291]
    if (
      !leftEyeInner ||
      !rightEyeInner ||
      !leftEyeCenter ||
      !rightEyeCenter ||
      !forehead ||
      !chin ||
      !leftCheek ||
      !rightCheek ||
      !nose ||
      !mouthTop ||
      !mouthBottom ||
      !mouthLeft ||
      !mouthRight
    ) {
      return
    }

    const W = canvasWidth
    const H = canvasHeight
    const eyeDist = landmarkDistance(leftEyeInner, rightEyeInner) * W
    if (eyeDist <= 0) return

    const leftEyePx = toCanvasPx(leftEyeInner.x, leftEyeInner.y, W, H)
    const rightEyePx = toCanvasPx(rightEyeInner.x, rightEyeInner.y, W, H)
    const foreheadPx = toCanvasPx(forehead.x, forehead.y, W, H)
    const chinPx = toCanvasPx(chin.x, chin.y, W, H)
    const leftCheekPx = toCanvasPx(leftCheek.x, leftCheek.y, W, H)
    const rightCheekPx = toCanvasPx(rightCheek.x, rightCheek.y, W, H)
    const leftEyeCenterPx = toCanvasPx(leftEyeCenter.x, leftEyeCenter.y, W, H)
    const rightEyeCenterPx = toCanvasPx(rightEyeCenter.x, rightEyeCenter.y, W, H)
    const nosePx = toCanvasPx(nose.x, nose.y, W, H)
    const mouthTopPx = toCanvasPx(mouthTop.x, mouthTop.y, W, H)
    const mouthBottomPx = toCanvasPx(mouthBottom.x, mouthBottom.y, W, H)
    const mouthLeftPx = toCanvasPx(mouthLeft.x, mouthLeft.y, W, H)
    const mouthRightPx = toCanvasPx(mouthRight.x, mouthRight.y, W, H)

    const eyeMidX = (leftEyePx.x + rightEyePx.x) / 2
    const eyeMidY = (leftEyePx.y + rightEyePx.y) / 2
    const faceWidth = Math.abs(rightCheekPx.x - leftCheekPx.x)
    const faceHeight = Math.abs(chinPx.y - foreheadPx.y)
    const cx = eyeMidX
    const cy = eyeMidY + faceHeight * 0.15
    const radius = Math.max(
      eyeDist * 1.82,
      faceWidth * 0.96,
      faceHeight * 1.02,
      (chinPx.y - cy) + eyeDist * 0.32,
      (cy - foreheadPx.y) + eyeDist * 0.34
    )
    const rollRad = expression.headRoll * (Math.PI / 180)

    const leftEyeRel = { x: leftEyeCenterPx.x - cx, y: leftEyeCenterPx.y - cy }
    const rightEyeRel = { x: rightEyeCenterPx.x - cx, y: rightEyeCenterPx.y - cy }
    const noseRel = { x: nosePx.x - cx, y: nosePx.y - cy }
    const mouthTopRel = { x: mouthTopPx.x - cx, y: mouthTopPx.y - cy }
    const mouthBottomRel = { x: mouthBottomPx.x - cx, y: mouthBottomPx.y - cy }
    const mouthLeftRel = { x: mouthLeftPx.x - cx, y: mouthLeftPx.y - cy }
    const mouthRightRel = { x: mouthRightPx.x - cx, y: mouthRightPx.y - cy }

    const cheekPuff = Math.max(
      getBlendshapeScore(result, "cheekPuff"),
      getBlendshapeScore(result, "mouthPucker") * 0.72
    )
    const cheekSquintLeft = getBlendshapeScore(result, "cheekSquintLeft")
    const cheekSquintRight = getBlendshapeScore(result, "cheekSquintRight")
    const smile = clamp((expression.mouthSmileLeft + expression.mouthSmileRight) / 1.3, 0, 1)
    const isSurprised = expression.browInnerUp > 0.48
    const winkLeft = expression.eyeBlinkLeft > 0.62 && expression.eyeBlinkRight < 0.42
    const winkRight = expression.eyeBlinkRight > 0.62 && expression.eyeBlinkLeft < 0.42
    const cheekFullness = clamp(
      Math.max(
        cheekPuff,
        smile * 0.42,
        clamp(1 - Math.abs(mouthRightRel.x - mouthLeftRel.x) / (eyeDist * 1.08), 0, 1) * 0.55
      ),
      0,
      1
    )

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rollRad)

    ctx.save()
    ctx.globalAlpha = 0.22
    ctx.fillStyle = "#7a4a00"
    ctx.beginPath()
    ctx.ellipse(radius * 0.06, radius * 0.1, radius * 1.05, radius * 0.98, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.restore()

    drawEar(ctx, -1, radius)
    drawEar(ctx, 1, radius)

    const headGrad = ctx.createRadialGradient(
      -radius * 0.3,
      -radius * 0.35,
      radius * 0.05,
      -radius * 0.05,
      radius * 0.05,
      radius * 1.15
    )
    headGrad.addColorStop(0, "#fffde0")
    headGrad.addColorStop(0.15, "#ffe566")
    headGrad.addColorStop(0.45, "#ffd426")
    headGrad.addColorStop(0.75, "#e8a800")
    headGrad.addColorStop(0.92, "#c87800")
    headGrad.addColorStop(1, "#9a5500")

    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.fillStyle = headGrad
    ctx.fill()

    ctx.fillStyle = "rgba(255,255,255,0.22)"
    ctx.beginPath()
    ctx.ellipse(-radius * 0.24, -radius * 0.34, radius * 0.36, radius * 0.23, -0.45, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "rgba(154,85,0,0.18)"
    ctx.beginPath()
    ctx.ellipse(radius * 0.08, radius * 0.32, radius * 0.8, radius * 0.62, 0, 0, Math.PI * 2)
    ctx.fill()

    const muzzleY = noseRel.y + radius * 0.17
    const cheekWidth = radius * 0.29 * (1 + cheekFullness * 0.18)
    const cheekHeight = radius * 0.2 * (1 + cheekFullness * 0.2)
    const muzzleGrad = ctx.createRadialGradient(0, muzzleY - radius * 0.04, 0, 0, muzzleY, radius * 0.46)
    muzzleGrad.addColorStop(0, "rgba(255,252,236,0.98)")
    muzzleGrad.addColorStop(1, "rgba(255,232,196,0.88)")
    ctx.fillStyle = muzzleGrad
    ctx.beginPath()
    ctx.ellipse(-radius * 0.26, muzzleY, cheekWidth, cheekHeight, 0.08, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(radius * 0.26, muzzleY, cheekWidth, cheekHeight, -0.08, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(0, muzzleY + radius * 0.02, radius * 0.22, radius * 0.16 * (1 + cheekFullness * 0.12), 0, 0, Math.PI * 2)
    ctx.fill()

    const leftBlushAlpha = clamp(0.1 + smile * 0.15 + cheekFullness * 0.12 + cheekSquintLeft * 0.12, 0.1, 0.34)
    const rightBlushAlpha = clamp(0.1 + smile * 0.15 + cheekFullness * 0.12 + cheekSquintRight * 0.12, 0.1, 0.34)

    ctx.fillStyle = `rgba(251, 146, 184, ${leftBlushAlpha})`
    ctx.beginPath()
    ctx.ellipse(-radius * 0.44, muzzleY + radius * 0.02, radius * 0.17, radius * 0.11 * (1 + cheekFullness * 0.18), -0.12, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = `rgba(251, 146, 184, ${rightBlushAlpha})`
    ctx.beginPath()
    ctx.ellipse(radius * 0.44, muzzleY + radius * 0.02, radius * 0.17, radius * 0.11 * (1 + cheekFullness * 0.18), 0.12, 0, Math.PI * 2)
    ctx.fill()

    drawEye(ctx, leftEyeRel.x, leftEyeRel.y, radius, expression.eyeBlinkLeft, isSurprised, winkLeft)
    drawEye(ctx, rightEyeRel.x, rightEyeRel.y, radius, expression.eyeBlinkRight, isSurprised, winkRight)

    if (winkLeft) drawSparkle(ctx, leftEyeRel.x - radius * 0.2, leftEyeRel.y - radius * 0.22, radius * 0.06)
    if (winkRight) drawSparkle(ctx, rightEyeRel.x + radius * 0.2, rightEyeRel.y - radius * 0.22, radius * 0.06)

    const noseRadius = radius * 0.078
    ctx.fillStyle = "#c9856a"
    ctx.beginPath()
    ctx.moveTo(noseRel.x, noseRel.y - noseRadius * 0.58)
    ctx.bezierCurveTo(
      noseRel.x + noseRadius,
      noseRel.y - noseRadius * 0.68,
      noseRel.x + noseRadius * 1.08,
      noseRel.y + noseRadius * 0.22,
      noseRel.x,
      noseRel.y + noseRadius * 0.72
    )
    ctx.bezierCurveTo(
      noseRel.x - noseRadius * 1.08,
      noseRel.y + noseRadius * 0.22,
      noseRel.x - noseRadius,
      noseRel.y - noseRadius * 0.68,
      noseRel.x,
      noseRel.y - noseRadius * 0.58
    )
    ctx.fill()

    ctx.fillStyle = "rgba(255,220,200,0.55)"
    ctx.beginPath()
    ctx.ellipse(
      noseRel.x - noseRadius * 0.28,
      noseRel.y - noseRadius * 0.12,
      noseRadius * 0.3,
      noseRadius * 0.22,
      -0.45,
      0,
      Math.PI * 2
    )
    ctx.fill()

    const whiskerLen = radius * 0.62
    ctx.strokeStyle = "#b07800"
    ctx.lineCap = "round"
    for (const side of [-1, 1] as const) {
      for (const index of [-1, 0, 1] as const) {
        ctx.lineWidth = radius * 0.012 - Math.abs(index) * radius * 0.003
        ctx.globalAlpha = 0.86 - Math.abs(index) * 0.1
        ctx.beginPath()
        const startX = noseRel.x + side * radius * 0.12
        const startY = noseRel.y + index * radius * 0.056
        const endX = startX + side * whiskerLen
        const endY = startY + index * radius * 0.052
        ctx.moveTo(startX, startY)
        ctx.quadraticCurveTo(
          startX + side * whiskerLen * 0.48,
          startY - index * radius * 0.018,
          endX,
          endY
        )
        ctx.stroke()
      }
    }
    ctx.globalAlpha = 1

    const mouthWidth = Math.max(Math.abs(mouthRightRel.x - mouthLeftRel.x) * (0.48 + cheekFullness * 0.08), radius * 0.17)
    const mouthHeight = Math.abs(mouthBottomRel.y - mouthTopRel.y)

    if (expression.jawOpen > 0.2) {
      const openAmount = Math.min((expression.jawOpen - 0.2) / 0.8, 1)
      const mouthOpenHeight = mouthHeight * 0.45 + radius * 0.18 * openAmount

      ctx.fillStyle = "#3d1a00"
      ctx.beginPath()
      ctx.ellipse(
        mouthTopRel.x,
        mouthTopRel.y + mouthOpenHeight * 0.34,
        mouthWidth,
        mouthOpenHeight,
        0,
        0,
        Math.PI * 2
      )
      ctx.fill()

      ctx.fillStyle = "#f5f5f0"
      const toothW = mouthWidth * 0.34
      const toothH = mouthOpenHeight * 0.26
      const toothY = mouthTopRel.y - toothH * 0.04
      for (let toothIndex = -1; toothIndex <= 1; toothIndex += 1) {
        const toothX = mouthTopRel.x + toothIndex * toothW * 0.92
        ctx.beginPath()
        ctx.roundRect(toothX - toothW * 0.42, toothY, toothW * 0.84, toothH, toothH * 0.35)
        ctx.fill()
      }

      ctx.fillStyle = "#e8637a"
      ctx.beginPath()
      ctx.ellipse(
        mouthTopRel.x,
        mouthTopRel.y + mouthOpenHeight * 0.6,
        mouthWidth * 0.56,
        mouthOpenHeight * 0.36,
        0,
        0,
        Math.PI * 2
      )
      ctx.fill()

      ctx.strokeStyle = "#c44a62"
      ctx.lineWidth = radius * 0.018
      ctx.beginPath()
      ctx.moveTo(mouthTopRel.x, mouthTopRel.y + mouthOpenHeight * 0.28)
      ctx.lineTo(mouthTopRel.x, mouthTopRel.y + mouthOpenHeight * 0.86)
      ctx.stroke()
    } else {
      ctx.strokeStyle = "#9a5a00"
      ctx.lineWidth = radius * 0.022
      ctx.lineCap = "round"

      ctx.beginPath()
      ctx.arc(
        mouthLeftRel.x + mouthWidth * 0.56,
        mouthTopRel.y + radius * 0.01,
        mouthWidth * 0.54,
        Math.PI * 0.88,
        Math.PI * 1.78
      )
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(
        mouthRightRel.x - mouthWidth * 0.56,
        mouthTopRel.y + radius * 0.01,
        mouthWidth * 0.54,
        Math.PI * 1.22,
        Math.PI * 0.12,
        true
      )
      ctx.stroke()
    }

    ctx.restore()
  }

  dispose(): void {}
}

filterRegistry.register(new CatFilter())
