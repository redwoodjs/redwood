import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

import { getPaths } from '@redwoodjs/project-config'

import { findAssetsInManifest } from './findAssetsInManifest'
import { RwRscServerGlobal } from './RwRscServerGlobal'

function readJSON(path: string) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

export class ProdRwRscServerGlobal extends RwRscServerGlobal {
  /** @type {import("./context").BuildManifest} */
  clientManifest

  clientSSRManifest?: Record<string, Array<string>>

  /**  @type {import("./context").BuildManifest} */
  serverManifest

  /**  @type {import("./context").BuildManifest | undefined} */
  clientDepsManifest: any // TODO (RSC) fix type

  /**  @type {import("./context").BuildManifest | undefined} */
  componentServerManifest

  constructor() {
    super()

    const rwPaths = getPaths()

    this.clientManifest = readJSON(
      join(rwPaths.web.dist, 'client-build-manifest.json')
    )

    // this.clientSSRManifest = readJSON(
    //   join(rwPaths.web.distServer, 'ssr-manifest.json')
    // )

    this.serverManifest = readJSON(
      join(rwPaths.web.distServer, 'server-build-manifest.json')
    )

    // const routerMode = import.meta.env.ROUTER_MODE
    const routerMode = 'server'

    this.clientDepsManifest = undefined
    this.componentServerManifest = undefined
    if (routerMode === 'server') {
      // this.clientDepsManifest = readJSON(
      //   join(this.buildAppRoot, 'dist', 'react-server', 'client-deps.json')
      // )

      // TODO (RSC) What's the difference between componentServerManifest and serverManifest?
      this.componentServerManifest = readJSON(
        join(rwPaths.web.distServer, 'server-build-manifest.json')
        // join(
        //   this.buildAppRoot,
        //   'dist',
        //   'server',
        //   'react-server',
        //   'manifest.json'
        // )
      )
    }

    this.routeManifest = readJSON(rwPaths.web.routeManifest)
  }

  bootstrapModules() {
    return []
    // return [
    //   `/${
    //     this.clientManifest[
    //       relative(import.meta.env.ROOT_DIR, import.meta.env.CLIENT_ENTRY)
    //     ].file
    //   }`,
    // ]
  }

  bootstrapScriptContent() {
    return `window.manifest = ${JSON.stringify({
      root: process.cwd(),
      client: undefined,
    })};`

    // TODO (RSC) Do we need something like this?
    // if (import.meta.env.ROUTER_MODE === 'server') {
    //   if (!this.clientDepsManifest) {
    //     throw new Error('clientDepsManifest is undefined')
    //   }

    //   // invariant(
    //   //   this.componentServerManifest,
    //   //   'reactServerManifest is undefined'
    //   // )
    //   // TODO (RSC) Error text doesn't match up with check. Is this correct? Or just a copy/paste error?
    //   if (!this.componentServerManifest) {
    //     throw new Error('reactServerManifest is undefined')
    //   }

    //   return `window.manifest = ${JSON.stringify({
    //     root: process.cwd(),
    //     client:
    //       import.meta.env.ROUTER_MODE === 'server'
    //         ? Object.fromEntries(
    //             Object.entries(this.clientDepsManifest).map(([key, _asset]) => [
    //               key,
    //               this.clientSSRManifest[
    //                 relative(import.meta.env.ROOT_DIR, key)
    //               ][0],
    //             ])
    //           )
    //         : undefined,
    //   })};`
    // } else {
    //   return `window.manifest = ${JSON.stringify({
    //     root: process.cwd(),
    //     client: undefined,
    //   })};`
    // }
  }

  async loadModule(id: string) {
    const url = this.findInServerManifest(id)
    const mod = await import(/* @vite-ignore */ url)
    return mod
  }

  chunkId(chunk: string) {
    return relative(getPaths().web.src, chunk)
  }

  findInServerManifest(chunk: string) {
    // const routerMode = import.meta.env.ROUTER_MODE
    const routerMode = Math.random() < 5 ? '_server' : 'server'

    const rwPaths = getPaths()

    const file = this.serverManifest[this.chunkId(chunk)]
    if (file) {
      return join(
        rwPaths.web.distServer,
        this.serverManifest[this.chunkId(chunk)].file
      )
    } else if (routerMode === 'server') {
      if (!this.componentServerManifest) {
        throw new Error('componentServerManifest is undefined')
      }

      // TODO (RSC) This path is never going to be correct.
      return join(
        rwPaths.web.distServer,
        'react-server',
        this.componentServerManifest[this.chunkId(chunk)].file
      )
    } else {
      throw new Error(`Could not find ${chunk} in server manifest`)
    }
  }

  async findAssetsForModules(modules: string[]) {
    console.log('ProdRwRscServerGlobal::findAssetsForModules modules', modules)
    return modules?.map((i) => this.findAssetsForModule(i)).flat() ?? []
  }

  findAssetsForModule(module: string) {
    // const routerMode = import.meta.env.ROUTER_MODE
    const routerMode = 'server'

    if (routerMode === 'server') {
      if (!this.componentServerManifest) {
        throw new Error('componentServerManifest is undefined')
      }
    }

    return [
      ...findAssetsInManifest(this.serverManifest, module).filter(
        (asset) => !asset.endsWith('.js') && !asset.endsWith('.mjs')
      ),
      // ...(routerMode === 'server'
      //   ? findAssetsInManifest(this.componentServerManifest, module).filter(
      //       (asset) => !asset.endsWith('.js') && !asset.endsWith('.mjs')
      //     )
      //   : []),
    ]
  }

  async findAssets(): Promise<string[]> {
    console.log('ProdRwRscServerGlobal::findAssets')
    // const deps = this.getDependenciesForURL('/')
    // return await this.findAssetsForModules(deps)

    // TODO (RSC) This is a hack. We need to figure out how to get the dependencies for the current page.
    // const deps = ['index.html', 'App.tsx', 'Counter.tsx']
    const deps = Object.keys(this.serverManifest).filter((name) =>
      /\.(tsx|jsx|js)$/.test(name)
    )
    console.log('deps', deps)
    return await this.findAssetsForModules(deps)

    // return deps.flatMap((dep) =>
    //   this.clientSSRManifest[dep]?.filter(
    //     (asset) => !asset.endsWith('.js') && !asset.endsWith('.mjs')
    //   )
    // )
  }
}
