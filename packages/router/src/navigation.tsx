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

export type NavigationBlockerFn = (
  from: Location,
  to: Location,
  method: NavigationMethod,
  confirm?: () => void
) => boolean

type NavigationBlocker = {
  id: string
  check: NavigationBlockerFn
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
  register: (blocker: NavigationBlockerFn) => string
  unregister: (blockerId: string) => void
}

const NavigationContext =
  createNamedContext<NavigationContextState>('NavigationState')

type NavigationProviderProps = {
  children: ReactNode
}

const NavigationProvider = ({ children }: NavigationProviderProps) => {
  /**
   * Blockers are functions that are called before a navigation action is performed
   */
  const [blockers, setBlockers] = useState<NavigationBlocker[]>([])

  /**
   * Navigation state is used to keep track of the current and previous location data
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
    const originalPushState = globalThis.history.pushState.bind(
      globalThis.history
    )
    const originalReplaceState = globalThis.history.replaceState.bind(
      globalThis.history
    )

    globalThis.history.pushState = function pushState(
      data: any,
      unused: string,
      url?: string | URL | null
    ) {
      const currentLocation = new URL(globalThis.location.href)
      const newLocation = new URL(globalThis.location.origin + url)

      if (
        currentLocation.pathname === newLocation.pathname &&
        currentLocation.search === newLocation.search &&
        currentLocation.hash === newLocation.hash
      ) {
        return
      }

      const blocked = blockers.some(({ check }) =>
        check(currentLocation, newLocation, NavigationMethod.PUSH, () => {
          originalPushState(data, unused, url)
        })
      )

      if (!blocked) {
        originalPushState(data, unused, url)
      }
    }

    globalThis.history.replaceState = function replaceState(
      data: any,
      unused: string,
      url?: string | URL | null
    ) {
      const currentLocation = new URL(globalThis.location.href)
      const newLocation = new URL(globalThis.location.origin + url)

      if (
        currentLocation.pathname === newLocation.pathname &&
        currentLocation.search === newLocation.search &&
        currentLocation.hash === newLocation.hash
      ) {
        return
      }

      const blocked = blockers.some(({ check }) =>
        check(navigation.from, navigation.to, NavigationMethod.REPLACE, () => {
          originalReplaceState(data, unused, url)
        })
      )

      if (!blocked) {
        originalReplaceState(data, unused, url)
      }
    }

    return () => {
      globalThis.history.pushState = originalPushState
      globalThis.history.replaceState = originalReplaceState
    }
  }, [blockers, location, navigation])

  /**
   * Adds an interceptor to the list of interceptors
   */
  const register = useCallback((fn: NavigationBlockerFn): string => {
    const id = 'RW_NAVIGATION_INTERCEPTOR_ID_' + Date.now()
    setBlockers((prev) => [
      ...prev,
      {
        id: id,
        check: fn,
      },
    ])
    return id
  }, [])

  /**
   * Removes an interceptor from the list of interceptors
   */
  const unregister = useCallback((blockerId: string) => {
    setBlockers((prev) => {
      const index = prev.findIndex((blocker) => blocker.id === blockerId)
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
