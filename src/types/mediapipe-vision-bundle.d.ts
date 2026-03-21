declare module "*vision_bundle.mjs" {
  import type { FaceLandmarkerResult } from "@/app/main/filters/mediapipe"

  export class FilesetResolver {
    static forVisionTasks(basePath?: string): Promise<unknown>
  }

  export class FaceLandmarker {
    static createFromOptions(
      wasmFileset: unknown,
      options: {
        baseOptions: { modelAssetPath: string }
        outputFaceBlendshapes: boolean
        outputFacialTransformationMatrixes: boolean
        runningMode: "VIDEO"
        numFaces: number
      }
    ): Promise<FaceLandmarker>

    detectForVideo(video: HTMLVideoElement, timestampMs: number): FaceLandmarkerResult
    close(): void
  }
}
