import type { AuthContextInterface } from '@redwoodjs/auth'

export const getApiGraphQLUrl = () => {
  return global.RWJS_API_GRAPHQL_URL
}

export interface FetchConfig {
  uri: string
  headers?: { 'auth-provider'?: string; authorization?: string }
}

export const FetchConfigContext = React.createContext<FetchConfig>({
  uri: getApiGraphQLUrl(),
})

type UseAuthType = () => AuthContextInterface<
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown
>

// TODO: Can we/should we move this into @redwoodjs/auth and export it so we can use it in more places?
const defaultAuthState: ReturnType<UseAuthType> = {
  loading: false,
  isAuthenticated: false,
  logIn: async () => {},
  logOut: async () => {},
  signUp: async () => {},
  currentUser: null,
  userMetadata: undefined,
  getToken: async () => null,
  getCurrentUser: async () => null,
  hasRole: () => false,
  reauthenticate: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  validateResetToken: async () => {},
  type: 'default',
  hasError: false,
}

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
        value={{ uri: getApiGraphQLUrl() }}
        {...rest}
      />
    )
  }

  return (
    <FetchConfigContext.Provider
      value={{
        uri: getApiGraphQLUrl(),
        headers: {
          'auth-provider': type,
        },
      }}
      {...rest}
    />
  )
}

export const useFetchConfig = () => React.useContext(FetchConfigContext)
