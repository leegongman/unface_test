// 파일 경로: src/app/main/hooks/useFaceFilter.ts
import { useEffect, useRef, useState } from "react"

import "../filters/bootstrap"
import type { FaceLandmarkerResult } from "../filters/mediapipe"
import { filterRegistry } from "../filters/registry"
import { parseExpression, parseFaceBounds } from "../filters/utils"
import type { FaceFilter } from "../filters/types"

interface UseFaceFilterParams {
  localVideoRef: React.MutableRefObject<HTMLVideoElement | null>
  localStreamRef: React.MutableRefObject<MediaStream | null>
  activeFilterId: string | null
  onFilterError?: () => void
}

interface UseFaceFilterReturn {
  filteredStream: MediaStream | null
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  isFilterLoading: boolean
}

type VisionBundleModule = {
  FaceLandmarker: {
    createFromOptions(
      wasmFileset: unknown,
      options: {
        baseOptions: { modelAssetPath: string }
        outputFaceBlendshapes: boolean
        outputFacialTransformationMatrixes: boolean
        runningMode: "VIDEO"
        numFaces: number
      }
    ): Promise<FaceLandmarkerInstance>
  }
  FilesetResolver: {
    forVisionTasks(basePath?: string): Promise<unknown>
  }
}

interface FaceLandmarkerInstance {
  detectForVideo(video: HTMLVideoElement, timestampMs: number): FaceLandmarkerResult
  close(): void
}

function ensureProcessingVideo(
  processingVideoRef: React.MutableRefObject<HTMLVideoElement | null>
): HTMLVideoElement {
  if (!processingVideoRef.current) {
    const video = document.createElement("video")
    video.autoplay = true
    video.muted = true
    video.playsInline = true
    video.setAttribute("muted", "true")
    processingVideoRef.current = video
  }

  return processingVideoRef.current
}

export function useFaceFilter({
  localVideoRef,
  localStreamRef,
  activeFilterId,
  onFilterError,
}: UseFaceFilterParams): UseFaceFilterReturn {
  const [filteredStream, setFilteredStream] = useState<MediaStream | null>(null)
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const faceLandmarkerRef = useRef<FaceLandmarkerInstance | null>(null)
  const processingVideoRef = useRef<HTMLVideoElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const activeFilterRef = useRef<FaceFilter | null>(null)
  const generatedTrackRef = useRef<MediaStreamTrack | null>(null)
  const capturedCanvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const processingVideo = ensureProcessingVideo(processingVideoRef)

    return () => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current)
      generatedTrackRef.current?.stop()
      capturedCanvasRef.current = null
      activeFilterRef.current?.dispose()
      faceLandmarkerRef.current?.close()
      if (processingVideo) {
        processingVideo.pause()
        processingVideo.srcObject = null
      }
      processingVideoRef.current = null
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const stopLoop = () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }

    const stopGeneratedTrack = () => {
      generatedTrackRef.current?.stop()
      generatedTrackRef.current = null
      capturedCanvasRef.current = null
      setFilteredStream(null)
    }

    const syncCapturedStream = (canvas: HTMLCanvasElement) => {
      if (capturedCanvasRef.current === canvas && generatedTrackRef.current?.readyState === "live") return

      generatedTrackRef.current?.stop()

      const canvasStream = canvas.captureStream(30)
      const generatedTrack = canvasStream.getVideoTracks()[0] ?? null

      generatedTrackRef.current = generatedTrack
      capturedCanvasRef.current = canvas
      setFilteredStream(generatedTrack ? new MediaStream([generatedTrack]) : null)
    }

    const renderFrame = () => {
      if (cancelled) return

      const canvas = canvasRef.current
      const sourceStream = localStreamRef.current
      const processingVideo = ensureProcessingVideo(processingVideoRef)

      if (processingVideo.srcObject !== sourceStream) {
        processingVideo.srcObject = sourceStream
        void processingVideo.play().catch(() => {})
      }

      const sourceVideo = localVideoRef.current?.readyState && localVideoRef.current.readyState >= 2
        ? localVideoRef.current
        : processingVideo

      if (!canvas || !sourceVideo || sourceVideo.readyState < 2 || !sourceVideo.videoWidth || !sourceVideo.videoHeight) {
        animationFrameRef.current = requestAnimationFrame(renderFrame)
        return
      }

      if (canvas.width !== sourceVideo.videoWidth || canvas.height !== sourceVideo.videoHeight) {
        canvas.width = sourceVideo.videoWidth
        canvas.height = sourceVideo.videoHeight
      }

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        animationFrameRef.current = requestAnimationFrame(renderFrame)
        return
      }

      const cameraTrack = sourceStream?.getVideoTracks()[0] ?? null
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (!cameraTrack || !cameraTrack.enabled) {
        ctx.fillStyle = "#000"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        animationFrameRef.current = requestAnimationFrame(renderFrame)
        return
      }

      ctx.drawImage(sourceVideo, 0, 0, canvas.width, canvas.height)

      if (activeFilterRef.current && faceLandmarkerRef.current) {
        syncCapturedStream(canvas)
        const result = faceLandmarkerRef.current.detectForVideo(sourceVideo, performance.now())
        if (result?.faceLandmarks[0]) {
          const expression = parseExpression(result)
          const bounds = parseFaceBounds(result)
          activeFilterRef.current.render(ctx, result, expression, bounds, canvas.width, canvas.height)
        }
      }

      animationFrameRef.current = requestAnimationFrame(renderFrame)
    }

    const setup = async () => {
      stopLoop()
      activeFilterRef.current?.dispose()
      activeFilterRef.current = null
      stopGeneratedTrack()

      if (!activeFilterId) {
        setIsFilterLoading(false)
        return
      }

      const nextFilter = filterRegistry.get(activeFilterId)
      if (!nextFilter) {
        setIsFilterLoading(false)
        return
      }

      setIsFilterLoading(true)
      animationFrameRef.current = requestAnimationFrame(renderFrame)

      try {
        if (!faceLandmarkerRef.current) {
          const { FaceLandmarker, FilesetResolver } = await import("../../../../node_modules/@mediapipe/tasks-vision/vision_bundle.mjs") as VisionBundleModule
          const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm")
          faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
            },
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            runningMode: "VIDEO",
            numFaces: 1,
          })
        }

        await nextFilter.init()
        if (cancelled) {
          nextFilter.dispose()
          return
        }

        activeFilterRef.current = nextFilter

        setIsFilterLoading(false)
      } catch (err) {
        console.error("[useFaceFilter] 필터 로딩 실패:", err)
        setIsFilterLoading(false)
        activeFilterRef.current = null
        stopGeneratedTrack()
        if (!cancelled) onFilterError?.()
      }
    }

    void setup()

    return () => {
      cancelled = true
      stopLoop()
      activeFilterRef.current?.dispose()
      activeFilterRef.current = null
      stopGeneratedTrack()
      setIsFilterLoading(false)
    }
  }, [activeFilterId, localStreamRef, localVideoRef, onFilterError])

  return {
    filteredStream,
    canvasRef,
    isFilterLoading,
  }
}
