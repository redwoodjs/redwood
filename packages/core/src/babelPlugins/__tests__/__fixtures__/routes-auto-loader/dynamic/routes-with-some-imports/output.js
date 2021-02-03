const adminEditUserPage = {
  name: 'adminEditUserPage',
  loader: () =>
    import(
      '/Users/peterp/gh/redwoodjs/redwood/__fixtures__/example-todo-main/web/src/pages/admin/EditUserPage/EditUserPage'
    ),
}
const FatalErrorPage = {
  name: 'FatalErrorPage',
  loader: () =>
    import(
      '/Users/peterp/gh/redwoodjs/redwood/__fixtures__/example-todo-main/web/src/pages/FatalErrorPage/FatalErrorPage'
    ),
}
const HomePage = {
  name: 'HomePage',
  loader: () =>
    import(
      '/Users/peterp/gh/redwoodjs/redwood/__fixtures__/example-todo-main/web/src/pages/HomePage/HomePage'
    ),
}
const NotFoundPage = {
  name: 'NotFoundPage',
  loader: () =>
    import(
      '/Users/peterp/gh/redwoodjs/redwood/__fixtures__/example-todo-main/web/src/pages/NotFoundPage/NotFoundPage'
    ),
}
const TypeScriptPage = {
  name: 'TypeScriptPage',
  loader: () =>
    import(
      '/Users/peterp/gh/redwoodjs/redwood/__fixtures__/example-todo-main/web/src/pages/TypeScriptPage/TypeScriptPage'
    ),
}
import APage from 'src/pages/APage'