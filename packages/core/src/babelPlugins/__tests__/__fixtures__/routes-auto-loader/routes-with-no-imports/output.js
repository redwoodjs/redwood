// This is an empty `Routes.js` file, the pages will be automatically imported
const APage = {
  name: 'APage',
  loader: () => import('src/pages/APage'),
}
const BPage = {
  name: 'BPage',
  loader: () => import('src/pages/BPage'),
}
const NestedCPage = {
  name: 'NestedCPage',
  loader: () => import('src/pages/Nested/NestedCPage'),
}