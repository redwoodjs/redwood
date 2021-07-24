const BPage = {
  name: 'BPage',
  loader: () => import('src/pages/BPage'),
}
const NestedCPage = {
  name: 'NestedCPage',
  loader: () => import('src/pages/Nested/NestedCPage'),
}
// This should remain as is
import APage from 'src/pages/APage'
