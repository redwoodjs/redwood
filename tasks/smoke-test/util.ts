import isPortReachable from 'is-port-reachable'

export function waitForServer(port, interval) {
  return new Promise((resolve) => {
    const watchInterval = setInterval(async () => {
      console.log(`Waiting for server at localhost:${port}....`)
      const isServerUp = await isPortReachable(port, { host: 'localhost' })
      if (isServerUp) {
        clearInterval(watchInterval)
        resolve(true)
      }
    }, interval)
  })
}
