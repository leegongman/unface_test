// 파일 경로: src/app/main/filters/registry.ts
import type { FaceFilter } from "./types"

class FaceFilterRegistry {
  private readonly filters = new Map<string, FaceFilter>()

  register(filter: FaceFilter): void {
    this.filters.set(filter.id, filter)
  }

  get(id: string): FaceFilter | undefined {
    return this.filters.get(id)
  }

  getAll(): FaceFilter[] {
    return [...this.filters.values()]
  }

  getByCategory(category: FaceFilter["category"]): FaceFilter[] {
    return this.getAll().filter((filter) => filter.category === category)
  }
}

export const filterRegistry = new FaceFilterRegistry()
