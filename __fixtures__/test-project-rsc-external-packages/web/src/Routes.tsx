// In this file, all Page components from 'src/pages` are auto-imported. Nested
// directories are supported, and should be uppercase. Each subdirectory will be
// prepended onto the component name.
//
// Examples:
//
// 'src/pages/HomePage/HomePage.js'         -> HomePage
// 'src/pages/Admin/BooksPage/BooksPage.js' -> AdminBooksPage

import { Router, Route, Set } from '@redwoodjs/router'
import { serve } from '@redwoodjs/vite/client'

import NavigationLayout from './layouts/NavigationLayout/NavigationLayout'
import NotFoundPage from './pages/NotFoundPage/NotFoundPage'

const AboutPage = serve('AboutPage')
const HomePage = serve('HomePage')

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
