import type { ReactNode } from 'react'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'

import type { Location } from './location'
import { useLocation } from './location'
import { createNamedContext } from './util'

export enum NavigationMethod {
  PUSH = 'PUSH',
  REPLACE = 'REPLACE',
  POP = 'POP',
  UNLOAD = 'UNLOAD',
}

export type NavigationAction = {
  data: any
  unused: string
  url?: string | URL | null
}

export type NavigationInterceptorFn = (
  from: Location,
  to: Location,
  method: NavigationMethod
) => boolean

type NavigationInterceptor = {
  id: string
  fn: NavigationInterceptorFn
}

type Navigation = {
  from: Location
  to: Location
}

export type NavigationState = {
  previousLocation: Location
  currentLocation: Location
}

export type NavigationContextState = {
  navigation: Navigation
  register: (interceptor: NavigationInterceptorFn) => string
  unregister: (interceptorId: string) => void
}

const NavigationContext =
  createNamedContext<NavigationContextState>('NavigationState')

type NavigationProviderProps = {
  children: ReactNode
}

const NavigationProvider = ({ children }: NavigationProviderProps) => {
  /**
   * Interceptors are functions that are called before a navigation action is performed
   */
  const [interceptors, setInterceptors] = useState<NavigationInterceptor[]>([])

  /**
   * Navigation state is used to keep track of the current and previous location
   */
  const location: Location = useLocation()
  const [navigation, setNavigation] = useState({
    from: location,
    to: location,
  })

  useEffect(() => {
    setNavigation((prev) => {
      return {
        from: prev.to,
        to: location,
      }
    })
  }, [location])

  /**
   * Register the interceptors and override the browser history methods
   */
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    /**
     * Override the browser history methods
     */
    const pushState = window.history.pushState.bind(window.history)
    const replaceState = window.history.replaceState.bind(window.history)

    /**
     * Dry function
     */
    const createInterceptedStateFunction = (
      originalFunction: (
        data: any,
        unused: string,
        url?: string | URL | null
      ) => void,
      method: NavigationMethod
    ) => {
      return (data: any, unused: string, url?: string | URL | null) => {
        /**
         * Call the interceptors in order, if any of them returns true, the navigation
         * action is cancelled
         */
        for (const { fn: interceptor } of interceptors) {
          if (interceptor(navigation.from, navigation.to, method)) {
            return
          }
        }
        /**
         * If no interceptor cancels the navigation, we call the original function
         */
        originalFunction(data, unused, url)
      }
    }

    window.history.pushState = createInterceptedStateFunction(
      window.history.pushState,
      NavigationMethod.PUSH
    )
    window.history.replaceState = createInterceptedStateFunction(
      window.history.replaceState,
      NavigationMethod.REPLACE
    )

    const onPopState = () => {
      setNavigation((prev) => {
        return {
          from: prev.to,
          to: location,
        }
      })
    }

    window.addEventListener('popstate', onPopState)

    return () => {
      window.history.pushState = pushState
      window.history.replaceState = replaceState
      window.removeEventListener('popstate', onPopState)
    }
  }, [interceptors, location, navigation])

  /**
   * Adds an interceptor to the list of interceptors
   */
  const register = useCallback((fn: NavigationInterceptorFn): string => {
    const id = 'RW_NAVIGATION_INTERCEPTOR_ID_' + Date.now()
    setInterceptors((prev) => [
      ...prev,
      {
        id: id,
        fn: fn,
      },
    ])
    return id
  }, [])

  /**
   * Removes an interceptor from the list of interceptors
   */
  const unregister = useCallback((interceptorId: string) => {
    setInterceptors((prev) => {
      const index = prev.findIndex(
        (interceptor) => interceptor.id === interceptorId
      )
      if (index > -1) {
        prev.splice(index, 1)
      }
      return prev
    })
  }, [])

  return (
    <NavigationContext.Provider
      value={{
        navigation,
        register,
        unregister,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

const useNavigation = () => {
  const navigationContext = useContext(NavigationContext)

  if (navigationContext === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }

  // avoid unnecessary re-renders for the consumers of this hook
  const { register, unregister, navigation } = useMemo(
    () => navigationContext,
    [navigationContext]
  )

  return { register, unregister, navigation }
}

export { NavigationProvider, useNavigation }
