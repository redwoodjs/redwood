import { useCallback, useContext, useEffect, useState } from 'react'

import { gHistory } from './history'
import { createNamedContext } from './util'

export interface NavigateOptions {
  replace?: boolean
}

export interface NavigationContextInterface {
  blocked: boolean
  navigate: (to: string, options?: NavigateOptions) => void
  back: () => void
  block: (when: boolean) => void
  confirm: () => void
  abort: () => void
}

/**
 * Context for managing page navigation.
 */
const NavigationContext =
  createNamedContext<NavigationContextInterface>('PageNavigation')

/**
 * Provides the NavigationContext to its children components.
 * @component
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to be wrapped by the NavigationProvider.
 * @returns {React.ReactNode} - Wrapped components with the NavigationContext.
 */
export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [queue, setQueue] = useState<(() => void)[]>([])
  const [blockOnNavigation, setBlockonNavigation] = useState(false)
  const [blockedNavigation, setBlockedNavigation] = useState(false)

  /**
   * Blocks or unblocks navigation based on the provided condition.
   */
  const block = (when: boolean) => setBlockonNavigation(when)

  /**
   * Confirms a navigation action and releases the navigation block.
   */
  const confirm = () => setBlockedNavigation(false)

  /**
   * Aborts a navigation action and resets the queue and waiting state.
   */
  const abort = () => {
    setQueue([])
    setBlockedNavigation(false)
  }

  /**
   * Navigates back in the history.
   */
  const back = useCallback(() => {
    if (blockOnNavigation) {
      setBlockedNavigation(true)
    }
    setQueue((prev) => [...prev, () => gHistory.back()])
  }, [blockOnNavigation])

  /**
   * Navigates to a specified page.
   */
  const navigate = useCallback(
    (to: string, options?: NavigateOptions) => {
      if (blockOnNavigation) {
        setBlockedNavigation(true)
      }
      setQueue((prev) => [...prev, () => gHistory.navigate(to, options)])
    },
    [blockOnNavigation]
  )

  /**
   * Executes the next navigation action when not in a blocked state.
   */
  useEffect(() => {
    if (blockedNavigation) {
      return
    }
    if (queue.length > 0) {
      const next = queue.shift()
      if (next) {
        next()
      }
    }
  }, [queue, blockedNavigation])

  /**
   * External state name
   */
  const blocked = blockedNavigation

  return (
    <NavigationContext.Provider
      value={{ blocked, navigate, back, block, confirm, abort }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

/**
 * Hook for accessing the NavigationContext.
 * @returns {NavigationContextInterface} - Navigation context object.
 * @throws {Error} - Throws an error if used outside a NavigationContext provider.
 */
export const useNavigation = () => {
  const navigationContext = useContext(NavigationContext)

  if (!navigationContext) {
    throw new Error(
      'useNavigation must be used within a NavigationContext provider'
    )
  }

  return navigationContext
}

/**
 * @deprecated Please use navigate() from useNavigation instead.
 * @param {string} to - The destination page.
 * @param {NavigateOptions} [options] - Options for navigation.
 * @returns {void}
 */
export const navigate = (to: string, options?: NavigateOptions) => {
  return gHistory.navigate(to, options)
}

/**
 * @deprecated Please use back() from useNavigation instead.
 * @returns {void}
 */
export const back = () => {
  return gHistory.back()
}
