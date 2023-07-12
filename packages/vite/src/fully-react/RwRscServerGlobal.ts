import { lazy } from 'react'

export class RwRscServerGlobal {
  async loadModule(id: string) {
    return await import(/* @vite-ignore */ id)
  }

  lazyComponent(id: string) {
    return lazy(() => this.loadModule(id))
  }

  // Will be implemented by subclasses
  async findAssets(_id: string): Promise<any[]> {
    return []
  }

  getDependenciesForURL(_route: string): string[] {
    return []
  }
}
