import { getPaths } from '@redwoodjs/project-config'

import { buildRouteHooks } from './buildRouteHooks'
import { buildRouteManifest } from './buildRouteManifest'
import { buildRscClientAndServer } from './buildRscClientAndServer'
import { buildForStreamingServer } from './streaming/buildForStreamingServer'
import { startLiveReload } from './watch'

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
