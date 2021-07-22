// This is an empty `Routes.js` file, the pages will be automatically imported
const APage = {
  name: 'APage',
  loader: () => require('src/pages/APage'),
}
const BPage = {
  name: 'BPage',
  loader: () => require('src/pages/BPage'),
}
const NestedCPage = {
  name: 'NestedCPage',
  loader: () => require('src/pages/Nested/NestedCPage'),
}
