import './global.web-auto-imports'
import './config'

export { default as FatalErrorBoundary } from './components/FatalErrorBoundary'
export {
  FetchConfigProvider,
  useFetchConfig,
} from './components/FetchConfigProvider'
export {
  GraphQLHooksProvider,
  useQuery,
  useMutation,
} from './components/GraphQLHooksProvider'

export {
  createCell,
  CellFailureProps,
  CellLoadingProps,
  CellSuccessProps,
} from './components/createCell'

// TODO: Remove these in v.10, people can import from `@redwoodjs/web/toast`
// deprecated
export { useFlash, Flash } from './flash'
