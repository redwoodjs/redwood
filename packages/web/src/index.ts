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

import { createCell } from './components/createCell'
export { createCell }

/** @deprecated `withCell` will be removed in v0.32.0, please use `createCell` instead. */
export const withCell = createCell

// TODO: Remove these in v.10, people can import from `@redwoodjs/web/toast`
// deprecated
export { useFlash, Flash } from './flash'
