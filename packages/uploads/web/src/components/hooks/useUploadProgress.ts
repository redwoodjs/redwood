import { useState, useCallback } from 'react'

import type { UseUploadsMutationOptions } from './useUploadsMutation.js'
import {
  getMutationName,
  getUploadTokenHeaderName,
  useUploadToken,
} from './useUploadsMutation.js'

export const useUploadProgress = (
  mutation: UseUploadsMutationOptions['mutation'],
) => {
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
      return headers
    },
    onProgress: (ev: ProgressEvent) => {
      setProgress(ev.loaded / ev.total)
    },
    onAbortPossible: (abort: () => void) => {
      setAbortHandler(() => abort)
    },
  }

  const mutationName = getMutationName(mutation)
  const token = useUploadToken(mutationName)
  const uploadTokenHeaderName = getUploadTokenHeaderName()

  const context: {
    fetchOptions: typeof fetchOptionsWithProgress
    headers: Record<string, string>
  } = {
    fetchOptions: fetchOptionsWithProgress,
    headers: {
      [uploadTokenHeaderName]: token,
    },
  }

  return {
    context,
    progress,
    setProgress,
    onAbortHandler,
  }
}
