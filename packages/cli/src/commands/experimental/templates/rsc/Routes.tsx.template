// In this file, all Page components from 'src/pages` are auto-imported. Nested
// directories are supported, and should be uppercase. Each subdirectory will be
// prepended onto the component name.
//
// Examples:
//
// 'src/pages/HomePage/HomePage.js'         -> HomePage
// 'src/pages/Admin/BooksPage/BooksPage.js' -> AdminBooksPage

import { Route } from '@redwoodjs/router/dist/Route'
import { Set } from '@redwoodjs/router/dist/Set'
// @ts-expect-error - ESM issue. RW projects need to be ESM to properly pick up
// on the types here
import { Router } from '@redwoodjs/vite/Router'

import NavigationLayout from 'src/layouts/NavigationLayout'
import NotFoundPage from 'src/pages/NotFoundPage'

const Routes = () => {
  return (
    <Router>
      <Set wrap={NavigationLayout}>
        <Route path="/" page={HomePage} name="home" />
        <Route path="/about" page={AboutPage} name="about" />
      </Set>
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
