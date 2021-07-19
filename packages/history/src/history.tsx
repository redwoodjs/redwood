export interface NavigateOptions {
  replace: boolean
}

const createHistory = () => {
  type Listener = (ev?: PopStateEvent) => any

  const listeners: Record<string, Listener> = {}

  return {
    listen: (listener: Listener) => {
      const listenerId = 'RW_HISTORY_LISTENER_ID_' + Date.now()
      listeners[listenerId] = listener
      global.addEventListener('popstate', listener)
      return listenerId
    },
    navigate: (to: string, options?: NavigateOptions) => {
      const { pathname, search, hash } = new URL(global?.location?.origin + to)

      if (
        global?.location?.pathname !== pathname ||
        global?.location?.search !== search ||
        global?.location?.hash !== hash
      ) {
        if (options?.replace) {
          global.history.replaceState({}, '', to)
        } else {
          global.history.pushState({}, '', to)
        }

        for (const listener of Object.values(listeners)) {
          listener()
        }
      }
    },
    back: () => {
      global.history.back()

      for (const listener of Object.values(listeners)) {
        listener()
      }
    },
    remove: (listenerId: string) => {
      if (listeners[listenerId]) {
        const listener = listeners[listenerId]
        global.removeEventListener('popstate', listener)
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
const back = gHistory.back

export { gHistory, navigate, back }
