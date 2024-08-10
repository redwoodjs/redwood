// In this file, all Page components from 'src/pages` are auto-imported. Nested
// directories are supported, and should be uppercase. Each subdirectory will be
// prepended onto the component name.
//
// Examples:
//
// 'src/pages/HomePage/HomePage.js'         -> HomePage
// 'src/pages/Admin/BooksPage/BooksPage.js' -> AdminBooksPage

import { Route } from '@redwoodjs/router/Route'
import { Router } from '@redwoodjs/router/RscRouter'
import { Set } from '@redwoodjs/router/Set'

import MainLayout from './layouts/MainLayout/MainLayout'

const Routes = () => {
  return (
    <Router>
      <Set wrap={[MainLayout]}>
        <Route path="/" page={HomePage} name="home" />
        <Route path="/caching-one" page={CachingOnePage} name="cachingOne" />
        <Route path="/caching-two" page={CachingTwoPage} name="cachingTwo" />
      </Set>
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
