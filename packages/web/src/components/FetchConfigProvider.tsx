import type { AuthContextInterface, SupportedAuthTypes } from '@redwoodjs/auth'

export interface FetchConfig {
  uri: string
  headers?: { 'auth-provider': SupportedAuthTypes; authorization: string }
}
export const FetchConfigContext = React.createContext<FetchConfig>({
  uri: `${window.__REDWOOD__API_PROXY_PATH}/graphql`,
})

/**
 * The `FetchConfigProvider` understands Redwood's Auth Module
 * and determines the correct request-headers
 * required for authenticated and unauthenticated users.
 *
 * @param renderLoading
 * This provider blocks rendering whilst trying to figure out if the user is authenticated,
 * this prop can be used to render custom content, instead of a blank screen,
 * whilst it's doing that.
 */
export const FetchConfigProvider: React.FunctionComponent<{
  useAuth?: () => AuthContextInterface
  renderLoading?: () => React.ReactElement
}> = ({
  useAuth = window.__REDWOOD__USE_AUTH,
  renderLoading = () => null,
  ...rest
}) => {
  const { loading, isAuthenticated, getToken, type } = useAuth()
  const [authToken, setAuthToken] = React.useState<string | null>()

  React.useEffect(() => {
    const updateAuthToken = async () => {
      const token = await getToken()
      setAuthToken(token)
    }
    isAuthenticated && updateAuthToken()
  }, [isAuthenticated, getToken])

  const fetchConfigValue: FetchConfig = {
    uri: `${window.__REDWOOD__API_PROXY_PATH}/graphql`,
  }

  if (typeof useAuth === 'undefined') {
    return <FetchConfigContext.Provider value={fetchConfigValue} {...rest} />
  }

  // We block all rendering until auth has booted up.
  if (loading) {
    return renderLoading()
  }

  if (!isAuthenticated) {
    return <FetchConfigContext.Provider value={fetchConfigValue} {...rest} />
  } else if (!authToken) {
    // Wait for authToken to be retrieved before rendering.
    return renderLoading()
  }

  return (
    <FetchConfigContext.Provider
      value={{
        ...fetchConfigValue,
        headers: {
          'auth-provider': type,
          authorization: `Bearer ${authToken}`,
        },
      }}
      {...rest}
    />
  )
}

export const useFetchConfig = () => React.useContext(FetchConfigContext)
