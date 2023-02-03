export interface NavigateOptions {
  replace?: boolean
}

const createHistory = () => {
  type Listener = (ev?: PopStateEvent) => any

  const listeners: Record<string, Listener> = {}

  return {
    listen: (listener: Listener) => {
      const listenerId = 'RW_HISTORY_LISTENER_ID_' + Date.now()
      listeners[listenerId] = listener
      globalThis.addEventListener('popstate', listener)
      return listenerId
    },
    navigate: (to: string, options?: NavigateOptions) => {
      const { pathname, search, hash } = new URL(
        globalThis?.location?.origin + to
      )

      if (
        globalThis?.location?.pathname !== pathname ||
        globalThis?.location?.search !== search ||
        globalThis?.location?.hash !== hash
      ) {
        if (options?.replace) {
          globalThis.history.replaceState({}, '', to)
        } else {
          globalThis.history.pushState({}, '', to)
        }
      }

      for (const listener of Object.values(listeners)) {
        listener()
      }
    },
    back: () => {
      globalThis.history.back()

      for (const listener of Object.values(listeners)) {
        listener()
      }
    },
    remove: (listenerId: string) => {
      if (listeners[listenerId]) {
        const listener = listeners[listenerId]
        globalThis.removeEventListener('popstate', listener)
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

const { navigate, back } = gHistory

export { gHistory, navigate, back }
