import { useState, useCallback } from 'react'

export const useUploadProgress = () => {
  const [progress, setProgress] = useState<number>(0)
  const [abortHandler, setAbortHandler] = useState<(() => void) | null>(null)

  const onAbortHandler = useCallback(() => {
    if (abortHandler) {
      abortHandler()
      setProgress(0)
    }
  }, [abortHandler])

  const fetchOptionsWithProgress = {
    useUploadProgress: true,
    headers: (headers: Headers) => {
      const plainHeaders: Record<string, string> = {}
      headers.forEach((value, key) => {
        plainHeaders[key] = value
      })
      return {
        ...plainHeaders,
      }
    },
    onProgress: (ev: ProgressEvent) => {
      setProgress(ev.loaded / ev.total)
    },
    onAbortPossible: (abort: () => void) => {
      setAbortHandler(() => abort)
    },
  }

  return {
    fetchOptionsWithProgress,
    progress,
    setProgress,
    onAbortHandler,
  }
}
