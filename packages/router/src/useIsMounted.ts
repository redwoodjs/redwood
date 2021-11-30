import { useRef, useEffect, useCallback } from 'react'

export const useIsMounted = () => {
  const isMounted = useRef(true)

  useEffect(() => () => void (isMounted.current = false), [])

  return useCallback(() => isMounted.current, [])
}
