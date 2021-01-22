import { useMemo } from 'react'

/* Web side prerender utils, to be used on the browser */

export const isPrerendering = (): boolean => {
  return global.__REDWOOD__PRERENDERING ?? false
}

export const useIsBrowser = () => {
  return useMemo(() => {
    return {
      browser: !global?.__REDWOOD__PRERENDERING,
    }
  }, [])
}

export const BrowserOnly = ({ children }: { children: React.ReactNode }) => {
  const { browser } = useIsBrowser()

  return browser && children
}
