const createHistory = () => {
  type Listener = (ev?: PopStateEvent) => any

  const listeners: Record<string, Listener> = {}

  return {
    listen: (listener: Listener) => {
      const listenerId = 'RW_HISTORY_LISTENER_ID_' + Date.now()
      listeners[listenerId] = listener
      window.addEventListener('popstate', listener)
      return listenerId
    },
    navigate: (to: string) => {
      window.history.pushState({}, '', to)
      for (const listener of Object.values(listeners)) {
        listener()
      }
    },
    remove: (listenerId: string) => {
      if (listeners[listenerId]) {
        const listener = listeners[listenerId]
        window.removeEventListener('popstate', listener)
        delete listeners[listenerId]
      } else {
        console.warn(
          'History Listener with ID: ' + listenerId + ' does not exist.'
        )
      }
    },
  }
}

const gHistory = createHistory()

const navigate = gHistory.navigate

export { gHistory, navigate }
