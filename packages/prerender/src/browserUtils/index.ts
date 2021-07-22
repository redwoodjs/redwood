import { useMemo } from 'react'

/* Web side prerender utils, to be used on the browser */

export const isPrerendering = (): boolean => {
  return global.__REDWOOD__PRERENDERING ?? false
}

export const isBrowser = !isPrerendering()

export const useIsBrowser = () => {
  return useMemo(() => {
    return !global?.__REDWOOD__PRERENDERING
  }, [])
}

export const BrowserOnly = ({ children }: { children: React.ReactNode }) => {
  const isBrowser = useIsBrowser()

  return isBrowser && children
}
