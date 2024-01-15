import type { ReactNode } from 'react'
import { useContext, useEffect, useState } from 'react'

import { useLocation } from './location'
import { createNamedContext } from './util'

export enum ActionType {
  PUSH = 'PUSH',
  REPLACE = 'REPLACE',
}

export type HistoryAction = {
  data: any
  unused: string
  url?: string | URL | null
  type: ActionType
}

export type NavigationInterceptorFn = (
  from: string,
  to: string,
  action: HistoryAction
) => boolean

type NavigationInterceptor = {
  id: string
  fn: NavigationInterceptorFn
}

export type NavigationContextState = {
  register: (interceptor: NavigationInterceptorFn) => string
  unregister: (interceptorId: string) => void
}

const NavigationContext =
  createNamedContext<NavigationContextState>('Navigation')

const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation()
  const [interceptors, setInterceptors] = useState<NavigationInterceptor[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    // Intercept pushState and replaceState
    const pushState = window.history.pushState.bind(window.history)
    const replaceState = window.history.replaceState.bind(window.history)

    window.history.pushState = (
      data: any,
      unused: string,
      url?: string | URL | null
    ) => {
      for (const { fn: interceptor } of interceptors) {
        if (
          interceptor(location.pathname, window.location.pathname, {
            data,
            unused,
            url,
            type: ActionType.PUSH,
          })
        ) {
          return
        }
      }
      pushState(data, unused, url)
    }

    window.history.replaceState = (
      data: any,
      unused: string,
      url?: string | URL | null
    ) => {
      for (const { fn: interceptor } of interceptors) {
        if (
          interceptor(location.pathname, window.location.pathname, {
            data,
            unused,
            url,
            type: ActionType.REPLACE,
          })
        ) {
          return
        }
      }
      replaceState(data, unused, url)
    }

    return () => {
      window.history.pushState = pushState
      window.history.replaceState = replaceState
    }
  }, [interceptors, location])

  const register = (interceptor: NavigationInterceptorFn): string => {
    const id = 'RW_NAVIGATION_INTERCEPTOR_ID_' + Date.now()
    setInterceptors((prev) => [
      ...prev,
      {
        id: id,
        fn: interceptor,
      },
    ])
    return id
  }

  const unregister = (interceptorId: string) => {
    setInterceptors((prev) => {
      const index = prev.findIndex(
        (interceptor) => interceptor.id === interceptorId
      )
      if (index > -1) {
        prev.splice(index, 1)
      }
      return prev
    })
  }

  return (
    <NavigationContext.Provider
      value={{
        register,
        unregister,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

const useNavigation = () => {
  const location = useContext(NavigationContext)

  if (location === undefined) {
    throw new Error('useLocation must be used within a LocationProvider')
  }

  return location
}

export { NavigationProvider, useNavigation }
