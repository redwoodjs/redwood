import { relative } from 'node:path'

import { lazy } from 'react'

import { getPaths } from '@redwoodjs/project-config'

import { collectStyles } from './find-styles'
import { RwRscServerGlobal } from './RwRscServerGlobal'

// import viteDevServer from '../dev-server'
const viteDevServer: any = {}

export class DevRwRscServerGlobal extends RwRscServerGlobal {
  /** @type {import('vite').ViteDevServer} */
  viteServer

  constructor() {
    super()
    this.viteServer = viteDevServer
    // this.routeManifest = viteDevServer.routesManifest
  }

  bootstrapModules() {
    // return [`/@fs${import.meta.env.CLIENT_ENTRY}`]
    // TODO (RSC) No idea if this is correct or even what format CLIENT_ENTRY has.
    return [`/@fs${getPaths().web.entryClient}`]
  }

  bootstrapScriptContent() {
    return undefined
  }

  async loadModule(id: string) {
    return await viteDevServer.ssrLoadModule(id)
  }

  lazyComponent(id: string) {
    const importPath = `/@fs${id}`
    return lazy(
      async () =>
        await this.viteServer.ssrLoadModule(/* @vite-ignore */ importPath)
    )
  }

  chunkId(chunk: string) {
    // return relative(this.srcAppRoot, chunk)
    return relative(getPaths().web.src, chunk)
  }

  async findAssetsForModules(modules: string[]) {
    const styles = await collectStyles(
      this.viteServer,
      modules.filter((i) => !!i)
    )

    return [...Object.entries(styles ?? {}).map(([key, _value]) => key)]
  }

  async findAssets() {
    const deps = this.getDependenciesForURL('/')
    return await this.findAssetsForModules(deps)
  }
}
