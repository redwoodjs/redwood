import { useMemo } from 'react'

/* Web side prerender utils, to be used on the browser */

export const isPrerendering = (): boolean => {
  return !!window?.__REDWOOD_PRERENDER_MODE
}

export const useIsBrowser = () => {
  return useMemo(() => {
    return {
      browser: !window?.__REDWOOD_PRERENDER_MODE,
    }
  }, [])
}

export const BrowserOnly = ({ children }: { children: React.ReactNode }) => {
  const { browser } = useIsBrowser()

  return browser && children
}

declare global {
  interface Window {
    __REDWOOD_PRERENDER_MODE: boolean
  }
}
