import * as net from 'net'

import kill from 'kill-port'

export const shutdownPort = (port: number, method: 'tcp' | 'udp' = 'tcp') => {
  return kill(port, method)
}

export const tryPort = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const server = net.createServer()
      server.once('error', function () {
        resolve(false)
      })
      server.once('listening', function () {
        server.close()
        resolve(true)
      })
      server.listen(port)
    } catch (_) {
      resolve(false)
    }
  })
}
