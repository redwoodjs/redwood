import { useCallback, useEffect, useState } from "react"

export interface NavigateOptions {
  replace?: boolean
}

const createHistory = () => {
  type Listener = (ev?: PopStateEvent) => any

  const listeners: Record<string, Listener> = {}
  const [blocked, setBlocked] = useState(false)
  const [blockedQueue, setBlockedQueue] = useState<(() => void)[]>([])

  const notify = useCallback(() => {
    for (const listener of Object.values(listeners)) {
      listener()
    }
  }, [listeners])

  const back = useCallback(() => {
    if (!blocked) {
      globalThis.history.back()
      notify()
    }
    else {
      setBlockedQueue([...blockedQueue, () => {back()}])
    }
  }, [notify, blocked])

  const navigate = useCallback(
    (to: string, options?: NavigateOptions) => {
      if (!blocked) {
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
        notify()
      }
      else {
        setBlockedQueue([...blockedQueue, () => {navigate(to, options)}])
      }
    },
    [notify, blocked]
  )

  useEffect(() => {
    if (!blocked && blockedQueue.length > 0) {
      const next = blockedQueue.shift()
      if (next) next()
    }
  }, [blocked, blockedQueue])

  return {
    listen: (listener: Listener) => {
      const listenerId = 'RW_HISTORY_LISTENER_ID_' + Date.now()
      listeners[listenerId] = listener
      globalThis.addEventListener('popstate', listener)
      return listenerId
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
    block: () => setBlocked(true),
    unblock: () => setBlocked(false),
    flush: () => setBlockedQueue([]),
    blocked: blocked,
    navigate: (to: string, options?: NavigateOptions) => navigate(to, options),
    back: () => back(),
  }
}

const gHistory = createHistory()

const { navigate, back } = gHistory

export { gHistory, navigate, back }
