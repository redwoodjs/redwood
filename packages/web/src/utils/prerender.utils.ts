import { useEffect, useState } from 'react'

/* Web side prerender utils, to be used on the browser */

export const isPrerendering = (): boolean => {
  return !!window?.__REDWOOD_PRERENDER_MODE
}

export const useIsBrowser = () => {
  const [isBrowser, setIsBrowser] = useState(false)
  // Use effect only runs on the browser
  useEffect(() => {
    setIsBrowser(true)
  }, [])

  return isBrowser
}

declare global {
  interface Window {
    __REDWOOD_PRERENDER_MODE: boolean
  }
}
