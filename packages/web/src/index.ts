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

export { withCell } from './components/withCellHOC'

// deprecated
export { useFlash, Flash } from './flash'

export { default as toast } from 'react-hot-toast'
export * from 'react-hot-toast'
