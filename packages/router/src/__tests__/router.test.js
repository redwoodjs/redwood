import { render, waitFor, act } from '@testing-library/react'

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

      <Route
        path="/param-test/:value"
        page={({ value }) => <div>param {value}</div>}
        name="params"
      />
    </Router>
  )
  const screen = render(<TestRouter />)

  // starts on home page
  await waitFor(() => screen.getByText(/Home Page/i))

  // navigate to about page
  act(() => navigate(routes.about()))

  await waitFor(() => screen.getByText(/About Page/i))
  // navigate to private page
  // should redirect to home
  act(() => navigate(routes.private()))
  await waitFor(() => {
    expect(screen.queryByText(/Private Page/i)).toBeNull()
    screen.getByText(/Home Page/i)
  })
  // navigate to redirect page
  // should redirect to about
  act(() => navigate(routes.redirect()))
  await waitFor(() => {
    expect(screen.queryByText(/Redirect Page/)).toBeNull()
    expect(screen.queryByText(/About Page/)).toBeTruthy()
  })
  // mock log in
  // navigate to private page
  // should not redirect
  mockAuth(true)
  act(() => navigate(routes.private()))
  await waitFor(() => {
    expect(screen.getByText(/Private Page/)).toBeTruthy()
    expect(screen.queryByText(/Home Page/)).toBeNull()
  })

  mockAuth(false)
  act(() => navigate(routes.params({ value: 'one' })))
  await waitFor(() => screen.getByText(/param one/i))

  act(() => navigate(routes.params({ value: 'two' })))
  await waitFor(() => screen.getByText(/param two/i))
})
