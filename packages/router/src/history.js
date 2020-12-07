const createHistory = () => {
  const listeners = {}

  return {
    listen: (listener) => {
      const listenerId = 'RW_HISTORY_LISTENER_ID_' + Date.now()
      listeners[listenerId] = listener
      window.addEventListener('popstate', listener)
      return listenerId
    },
    navigate: (to) => {
      window.history.pushState({}, null, to)
      for (const listener of Object.values(listeners)) {
        listener()
      }
    },
    remove: (listenerId) => {
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
