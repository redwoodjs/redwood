import PropTypes from 'prop-types'
import { ThemeProvider } from 'styled-components'

import { GraphQLProvider as RealGraphQLProvider } from 'src/graphql'

// Ordinary returns
let USE_AUTH
export const useAuth = () => {
  return USE_AUTH()
}

const HammerProvider = ({ auth, theme, children }) => {
  const {
    AuthProvider = React.Fragment,
    GraphQLProvider = RealGraphQLProvider,
    useAuth = () => ({}),
  } = auth
  USE_AUTH = useAuth

  return (
    <AuthProvider>
      <GraphQLProvider>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </GraphQLProvider>
    </AuthProvider>
  )
}

HammerProvider.propTypes = {
  auth: PropTypes.shape({
    AuthProvider: PropTypes.func.isRequired,
    useAuth: PropTypes.func.isRequired,
    GraphQLProvider: PropTypes.func.isRequired,
  }),
  theme: PropTypes.object,
}

export default HammerProvider
