// In this file, all Page components from 'src/pages` are auto-imported. Nested
// directories are supported, and should be uppercase. Each subdirectory will be
// prepended onto the component name.
//
// Examples:
//
// 'src/pages/HomePage/HomePage.js'         -> HomePage
// 'src/pages/Admin/BooksPage/BooksPage.js' -> AdminBooksPage

import { Route } from '@redwoodjs/router/dist/Route'
import { Router } from '@redwoodjs/router/dist/server-router'
import { Set } from '@redwoodjs/router/dist/Set'

import NavigationLayout from './layouts/NavigationLayout/NavigationLayout'
import ScaffoldLayout from './layouts/ScaffoldLayout/ScaffoldLayout'
import AboutPage from './pages/AboutPage/AboutPage'
import EmptyUserEmptyUsersPage from './pages/EmptyUser/EmptyUsersPage/EmptyUsersPage'
import EmptyUserNewEmptyUserPage from './pages/EmptyUser/NewEmptyUserPage/NewEmptyUserPage'
import HomePage from './pages/HomePage/HomePage'
import MultiCellPage from './pages/MultiCellPage/MultiCellPage'
import UserExampleNewUserExamplePage from './pages/UserExample/NewUserExamplePage/NewUserExamplePage'
import UserExampleUserExamplePage from './pages/UserExample/UserExamplePage/UserExamplePage'
import UserExampleUserExamplesPage from './pages/UserExample/UserExamplesPage/UserExamplesPage'

const NotFoundPage = () => {
  return <div>Not Found</div>
}

const Routes = ({ location }) => {
  return (
    <Router location={location}>
      <Set wrap={NavigationLayout} rnd={Math.random()}>
        <Route path="/" page={HomePage} name="home" />
        <Route path="/about" page={AboutPage} name="about" />
        <Route path="/multi-cell" page={MultiCellPage} name="multiCell" />

        <Set
          wrap={ScaffoldLayout}
          title="EmptyUsers"
          titleTo="emptyUsers"
          buttonLabel="New EmptyUser"
          buttonTo="newEmptyUser"
        >
          <Route
            path="/empty-users/new"
            page={EmptyUserNewEmptyUserPage}
            name="newEmptyUser"
          />
          <Route
            path="/empty-users"
            page={EmptyUserEmptyUsersPage}
            name="emptyUsers"
          />
        </Set>

        <Set
          wrap={ScaffoldLayout}
          title="UserExamples"
          titleTo="userExamples"
          buttonLabel="New UserExample"
          buttonTo="newUserExample"
        >
          <Route
            path="/user-examples/new"
            page={UserExampleNewUserExamplePage}
            name="newUserExample"
          />
          <Route
            path="/user-examples/{id:Int}"
            page={UserExampleUserExamplePage}
            name="userExample"
          />
          <Route
            path="/user-examples"
            page={UserExampleUserExamplesPage}
            name="userExamples"
          />
        </Set>
      </Set>
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
