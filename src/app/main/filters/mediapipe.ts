// 파일 경로: src/app/main/filters/mediapipe.ts
export interface FaceLandmarkerCategory {
  score: number
  index: number
  categoryName: string
  displayName: string
}

export interface FaceBlendshapeClassification {
  categories: FaceLandmarkerCategory[]
  headIndex: number
  headName: string
}

export interface FaceLandmarkerMatrix {
  rows: number
  columns: number
  data: number[]
}

export interface FaceLandmark {
  x: number
  y: number
  z: number
  visibility?: number
  presence?: number
}

export interface FaceLandmarkerResult {
  faceLandmarks: FaceLandmark[][]
  faceBlendshapes: FaceBlendshapeClassification[]
  facialTransformationMatrixes: FaceLandmarkerMatrix[]
}
