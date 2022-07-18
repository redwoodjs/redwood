import { useCallback } from 'react'

import { AuthImplementation } from 'src/authImplementations/AuthImplementation'

export const useToken = (
  authImplementation: AuthImplementation<
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown
  >
) => {
  return useCallback(async () => {
    try {
      const token = await authImplementation.getToken()
      return token
    } catch (e) {
      console.error('Caught internal:', e)
      return null
    }
  }, [authImplementation])
}
