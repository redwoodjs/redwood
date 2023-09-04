import { useCallback } from 'react'

import type { AuthImplementation } from '../AuthImplementation'

import { AuthProviderConfig } from './AuthProvider'
import { useToken } from './useToken'

export const useCurrentUser = (
  authImplementation: AuthImplementation,
  authProviderClientConfig?: AuthProviderConfig
) => {
  const getToken = useToken(authImplementation)

  return useCallback(async (): Promise<Record<string, unknown>> => {
    // Always get a fresh token, rather than use the one in state
    const token = await getToken()

    const fetcher =
      authProviderClientConfig?.fetchConfig?.fetch ?? globalThis.fetch

    const response = await fetcher(globalThis.RWJS_API_GRAPHQL_URL, {
      ...(authProviderClientConfig?.fetchConfig?.fetchOptions ?? {}),
      method: 'POST',
      credentials:
        (authProviderClientConfig?.fetchConfig
          ?.credentials as RequestCredentials) ?? 'include',
      headers: {
        'content-type': 'application/json',
        'auth-provider': authImplementation.type,
        authorization: `Bearer ${token}`,
        ...(authProviderClientConfig?.fetchConfig?.headers ?? {}),
      },
      body: JSON.stringify({
        query:
          'query __REDWOOD__AUTH_GET_CURRENT_USER { redwood { currentUser } }',
      }),
    })

    if (response.ok) {
      const { data } = await response.json()
      return data?.redwood?.currentUser
    } else {
      throw new Error(
        `Could not fetch current user: ${response.statusText} (${response.status})`
      )
    }
  }, [
    authImplementation.type,
    authProviderClientConfig?.fetchConfig?.credentials,
    authProviderClientConfig?.fetchConfig?.fetch,
    authProviderClientConfig?.fetchConfig?.fetchOptions,
    authProviderClientConfig?.fetchConfig?.headers,
    getToken,
  ])
}
