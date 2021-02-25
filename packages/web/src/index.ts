import './global.web-auto-imports'
import './config'

import toast from 'react-hot-toast'
export { toast }
export * from 'react-hot-toast'

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
