import React from 'react'

import '@testing-library/jest-dom/extend-expect'
import { act, render } from '@testing-library/react'

import { navigate, Route, Router } from '../'
import { Private, Set } from '../Set'

/**
 * 🎩 Heads-up, in this test we're not mocking LazyComponent
 * because all the tests explicitly define the pages in the router.
 *
 * If you add tests with dynamic imports i.e. all the pages aren't explicitly supplied to the route
 * then you'll need to mock LazyComponent (see router.test.tsx)
 */

const HomePage = () => <h1>Home Page</h1>
const Page = () => <h1>Page</h1>

beforeEach(() => {
  window.history.pushState({}, '', '/')
})

let err: typeof console.error

beforeAll(() => {
  // Hide thrown exceptions. We're expecting them, and they clutter the output
  err = console.error
  console.error = jest.fn()
})

afterAll(() => {
  console.error = err
})

test('Sets nested in Private should not error out if no authenticated prop provided', () => {
  const Layout1 = ({ children }) => (
    <div>
      <p>Layout1</p>
      {children}
    </div>
  )

  const SetInsidePrivate = () => (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/auth" page={() => 'Regular Auth'} name="auth" />
      <Route path="/adminAuth" page={() => 'Admin Auth'} name="adminAuth" />
      <Private unauthenticated="auth">
        <Route path="/two/{slug}" page={Page} name="two" />
        {/* The Set below is private implicitly (nested under private), but
        should not need an unauthenticated prop */}
        <Set wrap={Layout1}>
          <Private roles="admin" unauthenticated="adminAuth">
            <Route path="/three" page={Page} name="three" />
          </Private>
        </Set>
      </Private>
      <Set wrap={Layout1} private>
        <Route path="/four" page={Page} name="four" />
      </Set>
    </Router>
  )

  render(<SetInsidePrivate />)

  expect(() => {
    act(() => navigate('/three'))
  }).not.toThrowError()

  // But still throws if you try to navigate to a private route without an unauthenticated prop
  expect(() => {
    act(() => navigate('/four'))
  }).toThrowError('You must specify an `unauthenticated` route')
})

test('Sets nested in `<Set private>` should not error out if no authenticated prop provided', () => {
  const Layout1 = ({ children }) => (
    <div>
      <p>Layout1</p>
      {children}
    </div>
  )

  const SetInsideSetPrivate = () => (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/auth" page={() => 'Regular Auth'} name="auth" />
      <Route path="/adminAuth" page={() => 'Admin Auth'} name="adminAuth" />
      <Set private unauthenticated="auth">
        <Route path="/two/{slug}" page={Page} name="two" />
        {/* The Set below is private implicitly (nested under private), but
        should not need an unauthenticated prop */}
        <Set wrap={Layout1}>
          <Private roles="admin" unauthenticated="adminAuth">
            <Route path="/three" page={Page} name="three" />
          </Private>
        </Set>
      </Set>
      <Set wrap={Layout1} private>
        <Route path="/four" page={Page} name="four" />
      </Set>
    </Router>
  )

  render(<SetInsideSetPrivate />)

  expect(() => act(() => navigate('/three'))).not.toThrowError()

  // But still throws if you try to navigate to a private route without an unauthenticated prop
  expect(() => act(() => navigate('/four'))).toThrowError(
    'You must specify an `unauthenticated` route'
  )
})
