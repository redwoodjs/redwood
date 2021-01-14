import { useEffect, useState } from 'react'

export const isPrerendering = (): boolean => {
  // @ts-expect-error-next-line
  return !!globalThis?.prerenderMode
}

export const useIsBrowser = () => {
  const [isBrowser, setIsBrowser] = useState(false)
  // Use effect only runs on the browser
  useEffect(() => {
    setIsBrowser(true)
  }, [])

  return isBrowser
}
