import React from 'react'

import { Router, Route } from '@redwoodjs/router'

import { useAuth } from './auth'

// NOTE(jgmw): These are typically injected by a babel plugin
import HomePage from './pages/HomePage/HomePage.jsx'
import NotFoundPage from './pages/NotFoundPage/NotFoundPage.jsx'
import Test1Page from './pages/Test1Page/Test1Page.jsx'
import Test2Page from './pages/Test2Page/Test2Page.jsx'

const Routes = () => {
  return (
    <Router useAuth={useAuth}>
      <Route path="/test-2" page={Test2Page} name="test-2" />
      <Route path="/test-1" page={Test1Page} name="test-1" />
      <Route path="/" page={HomePage} name="home" />
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
