export default `
import { Router, Route } from '@redwoodjs/router'

const Routes = () => {
  return (
    <Router>
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
`
