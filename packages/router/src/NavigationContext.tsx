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
  block: () => void
  unblock: () => void
  flush: () => void
}

const NavigationContext =
  createNamedContext<NavigationContextInterface>('PageNavigation')

interface Props {
  children: React.ReactNode
}

export const NavigationContextProvider: React.FC<Props> = ({ children }) => {
  const [blocked, setBlocked] = useState(false)
  const [blockedQueue, setBlockedQueue] = useState<(() => void)[]>([])

  const block = () => setBlocked(true)
  const unblock = () => setBlocked(false)
  const flush = () => setBlockedQueue([])

  const back = useCallback(() => {
    if (!blocked) {
      gHistory.back()
    } else {
      setBlockedQueue([
        ...blockedQueue,
        () => {
          gHistory.back()
        },
      ])
    }
  }, [blocked, blockedQueue])

  const navigate = useCallback(
    (to: string, options?: NavigateOptions) => {
      if (!blocked) {
        gHistory.navigate(to, options)
      } else {
        setBlockedQueue([
          ...blockedQueue,
          () => {
            gHistory.navigate(to, options)
          },
        ])
      }
    },
    [blocked, blockedQueue]
  )

  useEffect(() => {
    if (blocked && blockedQueue.length > 0) {
      const next = blockedQueue.shift()
      if (next) {
        next()
      }
    }
  }, [blocked, blockedQueue])

  return (
    <NavigationContext.Provider
      value={{ blocked, navigate, back, block, unblock, flush }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

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
 * @deprecated Please use useNavigation instead
 */
export const navigate = (to: string, options?: NavigateOptions) => {
  // Disable warning because we need it to be named navigate
  // instead of useNavigate for backwards compatibility
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { navigate } = useNavigation()
  navigate(to, options)
}

/**
 * @deprecated Please use useNavigation instead
 */
export const back = () => {
  // Disable warning because we need it to be named back
  // instead of useBack for backwards compatibility
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { back } = useNavigation()
  back()
}
