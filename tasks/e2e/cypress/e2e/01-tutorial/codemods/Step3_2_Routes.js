export default `
// web/src/Routes.js

import { Router, Route, Set } from '@redwoodjs/router'
import BlogLayout from 'src/layouts/BlogLayout'

const Routes = () => {
  return (
    <Router>
      <Set wrap={BlogLayout}>
        <Route path="/about" page={AboutPage} name="about" />
        <Route path="/" page={HomePage} name="home" />
      </Set>
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
`
