// In this file, all Page components from 'src/pages` are auto-imported. Nested
// directories are supported, and should be uppercase. Each subdirectory will be
// prepended onto the component name.
//
// Examples:
//
// 'src/pages/HomePage/HomePage.js'         -> HomePage
// 'src/pages/Admin/BooksPage/BooksPage.js' -> AdminBooksPage

import { Router, Route } from '@redwoodjs/router'

const slug = {
  constraint: /\w+-\w+/,
  transform: (param) => param.split('-'),
}

const constraint = /\w+-\w+/
const transform = (param) => param.split('.')

const Routes = () => {
  return (
    <Router
      pageLoadingDelay={350}
      paramTypes={{
        slug,
        embeddedProperties: { constraint: constraint, transform },
        embedded: {
          constraint: /\w+.\w+/,
          transform: (param) => param.split('.'),
        },
      }}
    >
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
