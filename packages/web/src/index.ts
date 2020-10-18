import './global.web-auto-imports'
import './config'

export {
  useSubscription,
  useLazyQuery,
  useQuery,
  useMutation,
  useApolloClient,
} from '@apollo/client'

export { default as FatalErrorBoundary } from './components/FatalErrorBoundary'
export { default as RedwoodProvider } from './components/RedwoodProvider'

export * from './graphql'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export * from './flash'
