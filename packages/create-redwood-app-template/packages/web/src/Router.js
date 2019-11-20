import React from 'react'
import {
  BrowserRouter,
  Route as RealRoute,
  Switch,
  Redirect,
  Link,
} from 'react-router-dom'

import { useAuth } from './HammerProvider'

// Routes that are passed in as children to `Private` get their `authRequired`
// prop to `true`.
export const Private = ({ children }) => {
  return React.Children.map(children, (child) => {
    return React.cloneElement(child, { authRequired: true })
  })
}

// `PrivateRoute` will wait to determine if a user is authenticated
// before routing them to `redirectTo`, the default `login URL` or
// rendering the component
// passed to the route.
//
// <Router>
//   <Route path="/" />
//   <Private>
//     <Route path="/invoices" component={Secret} />
//     <Route path="/invoice/:id" component={Secret} />
//   </Private>
// </Router>
export const PrivateRoute = ({ path, redirectTo, ...rest }) => {
  const { loading, isAuthenticated, loginWithRedirect } = useAuth()

  if (loading) {
    // TODO: Replace this with a promise when suspense is around.
    return null
  }

  if (!isAuthenticated) {
    if (redirectTo) {
      return <Redirect to={redirectTo} />
    }

    loginWithRedirect({
      appState: { targetUrl: path },
    })
    return null
  }

  return <RealRoute path={path} {...rest} />
}

export const Route = ({ authRequired, ...rest }) => {
  return authRequired ? <PrivateRoute {...rest} /> : <RealRoute {...rest} />
}

export { BrowserRouter, Switch, Redirect, Link }
