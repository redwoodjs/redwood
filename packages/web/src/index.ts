import './global.web-auto-imports'
import './config'

export { useSubscription } from '@apollo/client/react/hooks/useSubscription'
export { useLazyQuery } from '@apollo/client/react/hooks/useLazyQuery'
export { useQuery } from '@apollo/client/react/hooks/useQuery'
export { useMutation } from '@apollo/client/react/hooks/useMutation'
export { useApolloClient } from '@apollo/client/react/hooks/useApolloClient'

export { default as FatalErrorBoundary } from 'src/components/FatalErrorBoundary'
export { default as RedwoodProvider } from 'src/components/RedwoodProvider'

export * from './graphql'
// @ts-expect-error - no defs
export * from './flash'
