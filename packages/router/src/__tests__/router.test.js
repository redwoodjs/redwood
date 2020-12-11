import { render, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import { Router, Route, Private, Redirect, navigate, routes } from '../'

// SETUP
const HomePage = () => <h1>Home Page</h1>
const AboutPage = () => <h1>About Page</h1>
const PrivatePage = () => <h1>Private Page</h1>
const RedirectPage = () => <Redirect to="/about" />
const mockAuth = (isAuthenticated = false) => {
  window.__REDWOOD__USE_AUTH = () => ({
    loading: false,
    isAuthenticated,
  })
}

beforeEach(() => {
  window.history.pushState({}, null, '/')
})

test('inits routes and navigates as expected', async () => {
  mockAuth(false)
  const TestRouter = () => (
    <Router useAuth={window.__REDWOOD__USE_AUTH}>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/about" page={AboutPage} name="about" />
      <Route path="/redirect" page={RedirectPage} name="redirect" />
      <Private unauthenticated="home">
        <Route path="/private" page={PrivatePage} name="private" />
      </Private>

      <Route
        path="/param-test/{value}"
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

  // navigate to redirect page
  // should redirect to about
  act(() => navigate(routes.redirect()))
  await waitFor(() => {
    expect(screen.queryByText(/Redirect Page/)).not.toBeInTheDocument()
    expect(screen.queryByText(/About Page/)).toBeTruthy()
  })

  act(() => navigate(routes.params({ value: 'one' })))
  await waitFor(() => screen.getByText(/param one/i))

  act(() => navigate(routes.params({ value: 'two' })))
  await waitFor(() => screen.getByText(/param two/i))
})

test('unauthenticated user is redirected away from private page', async () => {
  mockAuth(false)
  const TestRouter = () => (
    <Router useAuth={window.__REDWOOD__USE_AUTH}>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/about" page={AboutPage} name="about" />
      <Private unauthenticated="home">
        <Route path="/private" page={PrivatePage} name="private" />
      </Private>
    </Router>
  )
  const screen = render(<TestRouter />)

  // starts on home page
  await waitFor(() => screen.getByText(/Home Page/i))

  // navigate to private page
  // should redirect to home
  act(() => navigate(routes.private()))
  await waitFor(() => {
    expect(screen.queryByText(/Private Page/i)).not.toBeInTheDocument()
    screen.getByText(/Home Page/i)
  })
})

test('authenticated user can access private page', async () => {
  mockAuth(true)
  const TestRouter = () => (
    <Router useAuth={window.__REDWOOD__USE_AUTH}>
      <Route path="/" page={HomePage} name="home" />
      <Private unauthenticated="home">
        <Route path="/private" page={PrivatePage} name="private" />
      </Private>
    </Router>
  )
  const screen = render(<TestRouter />)

  // starts on home page
  await waitFor(() => screen.getByText(/Home Page/i))

  // navigate to private page
  // should not redirect
  act(() => navigate(routes.private()))
  await waitFor(() => {
    expect(screen.getByText(/Private Page/)).toBeTruthy()
    expect(screen.queryByText(/Home Page/)).not.toBeInTheDocument()
  })
})

test('can display a loading screen whilst waiting for auth', async () => {
  const TestRouter = () => (
    <Router useAuth={() => ({ loading: true })}>
      <Route path="/" page={HomePage} name="home" />
      <Private unauthenticated="home">
        <Route
          path="/private"
          page={PrivatePage}
          name="private"
          whileLoading={() => 'Loading...'}
        />
      </Private>
    </Router>
  )
  const screen = render(<TestRouter />)

  // starts on home page
  await waitFor(() => screen.getByText(/Home Page/i))

  // navigate to private page
  // should not redirect
  act(() => navigate(routes.private()))
  await waitFor(() => {
    expect(screen.getByText(/Loading.../)).toBeTruthy()
    expect(screen.queryByText(/Home Page/)).not.toBeInTheDocument()
  })
})

test('inits routes two private routes with a space in between and loads as expected', async () => {
  mockAuth(false)
  const TestRouter = () => (
    <Router useAuth={window.__REDWOOD__USE_AUTH}>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/about" page={AboutPage} name="about" />
      <Route path="/redirect" page={RedirectPage} name="redirect" />
      <Private unauthenticated="home">
        <Route path="/private" page={PrivatePage} name="private" />{' '}
        <Route path="/another-private" page={PrivatePage} name="private" />
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
})
