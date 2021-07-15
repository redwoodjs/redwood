import isPortReachable from 'is-port-reachable'

export function waitForServer(port, interval) {
  return new Promise((resolve) => {
    setInterval(async () => {
      const isServerUp = await isPortReachable(port)
      isServerUp && resolve(true)
    }, interval)
  })
}
