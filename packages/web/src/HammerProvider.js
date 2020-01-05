import PropTypes from 'prop-types'

import { GraphQLProvider as RealGraphQLProvider } from 'src/graphql'

let USE_AUTH
export const useAuth = () => {
  return USE_AUTH()
}

const HammerProvider = ({ auth = {}, children }) => {
  const {
    AuthProvider = React.Fragment,
    GraphQLProvider = RealGraphQLProvider,
    useAuth = () => ({}),
  } = auth
  USE_AUTH = useAuth
  return (
    <AuthProvider>
      <GraphQLProvider>{children}</GraphQLProvider>
    </AuthProvider>
  )
}

HammerProvider.propTypes = {
  auth: PropTypes.shape({
    AuthProvider: PropTypes.func.isRequired,
    useAuth: PropTypes.func.isRequired,
    GraphQLProvider: PropTypes.func.isRequired,
  }),
}

export default HammerProvider
