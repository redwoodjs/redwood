import { render, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import {
  Router,
  Route,
  navigate,
  routes,
  resetNamedRoutes,
  getAnnouncement,
} from '../internal'
import RouteAnnouncement from '../route-announcement'

// SETUP
const HomePage = () => <h1>Home Page</h1>

const RouteAnnouncementPage = () => (
  <html>
    <head>
      <title>title content</title>
    </head>
    <body>
      <h1>RouteAnnouncement Page </h1>
      <RouteAnnouncement visuallyHidden>
        RouteAnnouncement content
      </RouteAnnouncement>
      <main>main content</main>
    </body>
  </html>
)

const H1Page = () => (
  <html>
    <head>
      <title>title content</title>
    </head>
    <body>
      <h1>H1 Page</h1>
      <main>main content</main>
    </body>
  </html>
)

const NoH1Page = () => (
  <html>
    <head>
      <title>title content</title>
    </head>
    <body>
      <div>NoH1 Page</div>
      <main>main content</main>
    </body>
  </html>
)

const NoH1OrTitlePage = () => (
  <html>
    <head></head>
    <body>
      <div>NoH1OrTitle Page</div>
      <main>main content</main>
    </body>
  </html>
)

beforeEach(() => {
  window.history.pushState({}, null, '/')
  resetNamedRoutes()
})

test('route announcer renders with aria-live="assertive" and role="alert"', async () => {
  const TestRouter = () => (
    <Router>
      <Route path="/" page={HomePage} name="home" />
    </Router>
  )

  const screen = render(<TestRouter />)

  await waitFor(() => {
    screen.getByText(/Home Page/i)
    const routeAnnouncer = screen.getByRole('alert')
    const ariaLiveValue = routeAnnouncer.getAttribute('aria-live')
    const roleValue = routeAnnouncer.getAttribute('role')
    expect(ariaLiveValue).toBe('assertive')
    expect(roleValue).toBe('alert')
  })
})

test('getAnnouncement works', async () => {
  const TestRouter = () => (
    <Router>
      <Route path="/" page={RouteAnnouncementPage} name="routeAnnouncement" />
      <Route path="/h1" page={H1Page} name="h1" />
      <Route path="/noH1" page={NoH1Page} name="noH1" />
      <Route path="/noH1OrTitle" page={NoH1OrTitlePage} name="noH1OrTitle" />
    </Router>
  )

  const screen = render(<TestRouter />)

  // starts on route announcement.
  // since there's a RouteAnnouncement, it should announce that.
  await waitFor(() => {
    screen.getByText(/RouteAnnouncement Page/i)
    expect(getAnnouncement()).toBe('RouteAnnouncement content')
  })

  // navigate to h1
  // since there's no RouteAnnouncement, it should announce the h1.
  act(() => navigate(routes.h1()))
  await waitFor(() => {
    screen.getByText(/H1 Page/i)
    expect(getAnnouncement()).toBe('H1 Page')
  })

  // navigate to noH1.
  // since there's no h1, it should announce the title.
  act(() => navigate(routes.noH1()))
  await waitFor(() => {
    screen.getByText(/NoH1 Page/i)
    expect(getAnnouncement()).toBe('title content')
  })

  // navigate to noH1OrTitle.
  // since there's no h1 or title,
  // it should announce the location.
  act(() => navigate(routes.noH1OrTitle()))
  await waitFor(() => {
    screen.getByText(/NoH1OrTitle Page/i)
    expect(getAnnouncement()).toBe('new page at /noH1OrTitle')
  })
})
