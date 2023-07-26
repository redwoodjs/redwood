import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

import type { Manifest as BuildManifest } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

import { findAssetsInManifest } from './findAssetsInManifest'
import { RwRscServerGlobal } from './RwRscServerGlobal'

function readJSON(path: string) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

export class ProdRwRscServerGlobal extends RwRscServerGlobal {
  serverManifest: BuildManifest

  constructor() {
    super()

    const rwPaths = getPaths()

    this.serverManifest = readJSON(
      join(rwPaths.web.distServer, 'server-build-manifest.json')
    )
  }

  chunkId(chunk: string) {
    return relative(getPaths().web.src, chunk)
  }

  async findAssetsForModules(modules: string[]) {
    return modules?.map((i) => this.findAssetsForModule(i)).flat() ?? []
  }

  findAssetsForModule(module: string) {
    return [
      ...findAssetsInManifest(this.serverManifest, module).filter(
        (asset) => !asset.endsWith('.js') && !asset.endsWith('.mjs')
      ),
    ]
  }

  async findAssets(): Promise<string[]> {
    // TODO (RSC) This is a hack. We need to figure out how to get the
    // dependencies for the current page.
    const deps = Object.keys(this.serverManifest).filter((name) =>
      /\.(tsx|jsx|js)$/.test(name)
    )

    return await this.findAssetsForModules(deps)
  }
}
