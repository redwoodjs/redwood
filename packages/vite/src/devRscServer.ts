import { getPaths } from '@redwoodjs/project-config'

import { buildRouteHooks } from './buildRouteHooks.js'
import { buildRouteManifest } from './buildRouteManifest.js'
import { buildRscClientAndServer } from './buildRscClientAndServer.js'
import { buildForStreamingServer } from './streaming/buildForStreamingServer.js'
import { startLiveReload } from './watch.js'

export async function build() {
  await buildRscClientAndServer({ verbose: false })
  await buildForStreamingServer({ verbose: false })
  await buildRouteHooks(false, getPaths())
  await buildRouteManifest()
}

export async function initDevRscServer() {
  process.env.NODE_ENV = 'development'
  await startLiveReload()
}

initDevRscServer()
  .then(() => {
    console.log('we are ready', process.env.NODE_ENV)
  })
  .catch((e) => {
    //
    console.log('oh no!', e)
  })
