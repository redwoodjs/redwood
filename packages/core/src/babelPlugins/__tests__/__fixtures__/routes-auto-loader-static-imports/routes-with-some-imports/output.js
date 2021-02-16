const adminEditUserPage = {
  name: 'adminEditUserPage',
  loader: () =>
    require('/Users/peterp/gh/redwoodjs/redwood/__fixtures__/example-todo-main/web/src/pages/admin/EditUserPage/EditUserPage'),
}
const FatalErrorPage = {
  name: 'FatalErrorPage',
  loader: () =>
    require('/Users/peterp/gh/redwoodjs/redwood/__fixtures__/example-todo-main/web/src/pages/FatalErrorPage/FatalErrorPage'),
}
const HomePage = {
  name: 'HomePage',
  loader: () =>
    require('/Users/peterp/gh/redwoodjs/redwood/__fixtures__/example-todo-main/web/src/pages/HomePage/HomePage'),
}
const NotFoundPage = {
  name: 'NotFoundPage',
  loader: () =>
    require('/Users/peterp/gh/redwoodjs/redwood/__fixtures__/example-todo-main/web/src/pages/NotFoundPage/NotFoundPage'),
}
const TypeScriptPage = {
  name: 'TypeScriptPage',
  loader: () =>
    require('/Users/peterp/gh/redwoodjs/redwood/__fixtures__/example-todo-main/web/src/pages/TypeScriptPage/TypeScriptPage'),
}
// The expectation is that this import of `HomePage` should be removed.
import APage from 'src/pages/HomePage/HomePage'