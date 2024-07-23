export class RscCache {
  private cache = new Map<string, Thenable<React.ReactElement>>()
  private socket: WebSocket
  private sendRetries = 0

  constructor() {
    this.socket = new WebSocket('ws://localhost:18998')

    // Event listener for WebSocket connection open
    this.socket.addEventListener('open', () => {
      console.log('Connected to WebSocket server.')
    })

    // Event listener for incoming messages
    this.socket.addEventListener('message', (event) => {
      console.log('Incomming message', event)
    })
  }

  get(key: string): any {
    const value = this.cache.get(key)
    console.log('RscCache.get', key, value)
    return value
  }

  set(key: string, value: any) {
    console.log('RscCache.set', key, value)
    this.sendToWebSocket('set', { key, value })
    this.cache.set(key, value)
  }

  private sendToWebSocket(action: string, payload: Record<string, any>) {
    console.log('RscCache::sendToWebSocket action', action, 'payload', payload)

    if (this.socket.readyState === WebSocket?.OPEN) {
      this.sendRetries = 0
      this.socket.send(JSON.stringify({ id: 'rsc-cache-' + action, payload }))
    } else if (
      this.socket.readyState === WebSocket?.CONNECTING &&
      this.sendRetries < 10
    ) {
      const backoff = 300 + this.sendRetries * 100
      setTimeout(() => {
        this.sendRetries++
        this.sendToWebSocket(action, payload)
      }, backoff)
    } else if (this.sendRetries >= 10) {
      console.error('Exhausted retries to send message to WebSocket server.')
    } else {
      console.error('WebSocket connection is closed.')
    }
  }
}
