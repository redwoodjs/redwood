import { useCallback, useContext, useEffect, useState } from 'react'

import { gHistory } from './history'
import { createNamedContext } from './util'

export interface NavigateOptions {
  replace?: boolean
}

export interface NavigationContextInterface {
  waiting: boolean
  navigate: (to: string, options?: NavigateOptions) => void
  back: () => void
  block: (when: boolean) => void
  confirm: () => void
  abort: () => void
}

const NavigationContext =
  createNamedContext<NavigationContextInterface>('PageNavigation')

interface Props {
  children: React.ReactNode
}

export const NavigationContextProvider: React.FC<Props> = ({ children }) => {
  const [queue, setQueue] = useState<(() => void)[]>([])
  const [blocked, setBlocked] = useState(false)
  const [waiting, setWaiting] = useState(false)

  const block = (when: boolean) => setBlocked(when)
  const confirm = () => setWaiting(false)
  const abort = () => {
    setQueue([])
    setWaiting(false)
  }

  const back = useCallback(() => {
    if (blocked) setWaiting(true)
    setQueue([
      ...queue,
      () => {
        gHistory.back()
      },
    ])
  }, [blocked, queue])

  const navigate = useCallback(
    (to: string, options?: NavigateOptions) => {
      if (blocked) setWaiting(true)
      setQueue([
        ...queue,
        () => {
          gHistory.navigate(to, options)
        },
      ])
    },
    [blocked, queue]
  )

  useEffect(() => {
    if (waiting) return
    if (queue.length > 0) {
      const next = queue.shift()
      if (next) {
        next()
      }
    }
  }, [queue, waiting])

  return (
    <NavigationContext.Provider value={{ waiting, navigate, back, block, confirm, abort }}>
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
 * @deprecated Please use navigate() from useNavigation instead
 */
export const navigate = (to: string, options?: NavigateOptions) => {
  return gHistory.navigate(to, options)
}

/**
 * @deprecated Please use back() from useNavigation instead
 */
export const back = () => {
  return gHistory.back()
}
