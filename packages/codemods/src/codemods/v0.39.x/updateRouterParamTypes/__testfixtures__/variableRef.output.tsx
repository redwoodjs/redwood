// In this file, all Page components from 'src/pages` are auto-imported. Nested
// directories are supported, and should be uppercase. Each subdirectory will be
// prepended onto the component name.
//
// Examples:
//
// 'src/pages/HomePage/HomePage.js'         -> HomePage
// 'src/pages/Admin/BooksPage/BooksPage.js' -> AdminBooksPage

import { Router, Route } from '@redwoodjs/router'

const userRouteParamTypes = {
  slug: {
    match: /\w+-\w+/,
    parse: (param) => param.split('-'),
  },
  something: {
    match: /\w+.\w+/,
    parse: (param) => param.split('.'),
  },
}

const Routes = () => {
  return (
    <Router pageLoadingDelay={350} paramTypes={userRouteParamTypes}>
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
