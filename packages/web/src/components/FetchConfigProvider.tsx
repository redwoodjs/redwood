import type { AuthContextInterface, SupportedAuthTypes } from '@redwoodjs/auth'

export interface FetchConfig {
  uri: string
  headers?: { 'auth-provider': SupportedAuthTypes; authorization?: string }
}
export const FetchConfigContext = React.createContext<FetchConfig>({
  uri: `${global.__REDWOOD__API_PROXY_PATH}/graphql`,
})

const defaultAuthState = { loading: false, isAuthenticated: false }
type UseAuthType = () => AuthContextInterface

/**
 * The `FetchConfigProvider` understands Redwood's Auth and determines the
 * correct request-headers based on a user's authentication state.
 * Note that the auth bearer token is now passed in packages/web/src/apollo/index.tsx
 * as the token is retrieved async
 */
export const FetchConfigProvider: React.FunctionComponent<{
  useAuth?: UseAuthType
}> = ({
  useAuth = global.__REDWOOD__USE_AUTH ?? (() => defaultAuthState),
  ...rest
}) => {
  const { isAuthenticated, type } = useAuth()

  if (!isAuthenticated) {
    return (
      <FetchConfigContext.Provider
        value={{ uri: `${global.__REDWOOD__API_PROXY_PATH}/graphql` }}
        {...rest}
      />
    )
  }

  return (
    <FetchConfigContext.Provider
      value={{
        uri: `${global.__REDWOOD__API_PROXY_PATH}/graphql`,
        headers: {
          'auth-provider': type,
        },
      }}
      {...rest}
    />
  )
}

export const useFetchConfig = () => React.useContext(FetchConfigContext)
