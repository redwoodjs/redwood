import './global.web-auto-imports'
import './config'

export {
  useSubscription,
  useLazyQuery,
  useQuery,
  useMutation,
  useApolloClient,
} from '@apollo/client'

export { default as FatalErrorBoundary } from 'src/components/FatalErrorBoundary'
export { default as RedwoodProvider } from 'src/components/RedwoodProvider'

export * from './graphql'
// @ts-expect-error - no defs
export * from './flash'
