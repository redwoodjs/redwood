import { useMemo } from 'react'

/* Web side prerender utils, to be used on the browser */

export const isPrerendering = (): boolean => {
  return !!global?.__REDWOOD_PRERENDER_MODE
}

export const useIsBrowser = () => {
  return useMemo(() => {
    return {
      browser: !global?.__REDWOOD_PRERENDER_MODE,
    }
  }, [])
}

export const BrowserOnly = ({ children }: { children: React.ReactNode }) => {
  const { browser } = useIsBrowser()

  return browser && children
}
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      __REDWOOD_PRERENDER_MODE: boolean
    }
  }
}
