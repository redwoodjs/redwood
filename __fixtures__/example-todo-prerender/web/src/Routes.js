// In this file, all Page components from 'src/pages` are auto-imported. Nested
// directories are supported, and should be uppercase. Each subdirectory will be
// prepended onto the component name.
//
// Examples:
//
// 'src/pages/HomePage/HomePage.js'         -> HomePage
// 'src/pages/Admin/BooksPage/BooksPage.js' -> AdminBooksPage

import { Router, Route } from '@redwoodjs/router'
// import TypeScriptPage from './pages/TypeScriptPage/TypeScriptPage'

const Routes = () => {
  return (
    <Router>
      <Route path="/" page={HomePage} name="home" prerender/>
      <Route path="/typescript" page={TypeScriptPage} name="typescriptPage" prerender={true}/>
      <Route path="/somewhereElse" page={HomePage} name="someOtherPage" prerender/>
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
