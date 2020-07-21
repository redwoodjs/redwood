import { render, waitFor } from '@testing-library/react'

import { Router, Route, Private, Redirect, navigate, routes } from '../'

// SETUP
const HomePage = () => <h1>Home Page</h1>
const AboutPage = () => <h1>About Page</h1>
const PrivatePage = () => <h1>Private Page</h1>
const RedirectPage = () => <Redirect to="/about" />
const mockAuth = (loggedIn = false) => {
  window.__REDWOOD__USE_AUTH = jest.fn(() => ({
    loading: false,
    isAuthenticated: loggedIn,
  }))
}

beforeEach(() => {
  window.history.pushState({}, null, '/')
  mockAuth(false)
})

// <Router />
it('inits routes and navigates as expected', async () => {
  const TestRouter = () => (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/about" page={AboutPage} name="about" />
      <Route path="/redirect" page={RedirectPage} name="redirect" />
      <Private unauthenticated="home">
        <Route path="/private" page={PrivatePage} name="private" />
      </Private>
    </Router>
  )
  const { getByText, queryByText } = render(<TestRouter />)
  // starts on home page
  await waitFor(() => {
    expect(getByText(/Home Page/)).toBeTruthy()
  })
  // navigate to about page
  navigate(routes.about())
  await waitFor(() => {
    expect(getByText(/About Page/)).toBeTruthy()
  })
  // navigate to private page
  // should redirect to home
  navigate(routes.private())
  await waitFor(() => {
    expect(queryByText(/Private Page/)).toBeNull()
    expect(getByText(/Home Page/)).toBeTruthy()
  })
  // navigate to redirect page
  // should redirect to about
  navigate(routes.redirect())
  await waitFor(() => {
    expect(queryByText(/Redirect Page/)).toBeNull()
    expect(queryByText(/About Page/)).toBeTruthy()
  })
  // mock log in
  // navigate to private page
  // should not redirect
  mockAuth(true)
  navigate(routes.private())
  await waitFor(() => {
    expect(getByText(/Private Page/)).toBeTruthy()
    expect(queryByText(/Home Page/)).toBeNull()
  })
})
