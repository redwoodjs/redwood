// import { buildForStreamingServer } from './streaming/buildForStreamingServer.js'
import { startLiveReload } from './watch.js'

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
