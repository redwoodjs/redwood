// In this file, all Page components from 'src/pages` are auto-imported. Nested
// directories are supported, and should be uppercase. Each subdirectory will be
// prepended onto the component name.
//
// Examples:
//
// 'src/pages/HomePage/HomePage.js'         -> HomePage
// 'src/pages/Admin/BooksPage/BooksPage.js' -> AdminBooksPage

import { Router, Route } from '@redwoodjs/router'
import SetLayout from 'src/layouts/SetLayout'

import FooPage from 'src/pages/FooPage'

const Routes = () => {
  return (
    <Router>
      <Route path="/" page={HomePage} name="home" prerender/>
      <Route path="/typescript" page={TypeScriptPage} name="typescriptPage" prerender />
      <Route path="/somewhereElse" page={EditUserPage} name="someOtherPage" prerender />
      <Set wrap={SetLayout} prerender>
        <Route path="/foo" page={FooPage} name="fooPage" />
        <Route path="/bar" page={BarPage} name="barPage" />
      </Set>
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
