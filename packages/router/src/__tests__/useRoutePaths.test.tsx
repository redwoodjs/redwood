/** @jest-environment jsdom */
import React from 'react'

import { render } from '@testing-library/react'
import { act } from 'react-dom/test-utils'

import { navigate } from '../history'
import { Route, Router } from '../router'
import { Set } from '../Set'
import { useRoutePaths, useRoutePath } from '../useRoutePaths'

test('useRoutePaths and useRoutePath', async () => {
  const HomePage = () => {
    const routePaths = useRoutePaths()
    // Sorry about the `as never` stuff here. In an actual project we have
    // generated types to use, but not here
    const homePath = useRoutePath('home' as never)

    return (
      <>
        <h1>Home Page</h1>
        <p>My path is {homePath}</p>
        <p>All paths: {Object.values(routePaths).join(',')}</p>
      </>
    )
  }

  interface LayoutProps {
    children: React.ReactNode
  }

  const Layout = ({ children }: LayoutProps) => {
    // No name means current route
    const routePath = useRoutePath()

    return (
      <>
        <h1>Current route path: &quot;{routePath}&quot;</h1>
        {children}
      </>
    )
  }

  const Page = () => <h1>Page</h1>

  const TestRouter = () => (
    <Router>
      <Set wrap={Layout}>
        <Route path="/" page={HomePage} name="home" />
        <Route path="/one" page={Page} name="one" />
        <Route path="/two/{id:Int}" page={Page} name="two" />
      </Set>
    </Router>
  )

  const screen = render(<TestRouter />)

  await screen.findByText('Home Page')
  await screen.findByText(/^My path is\s+\/$/)
  await screen.findByText(/^All paths:\s+\/,\/one,\/two\/\{id:Int\}$/)
  await screen.findByText('Current route path: "/"')

  act(() => navigate('/one'))
  await screen.findByText('Current route path: "/one"')

  act(() => navigate('/two/123'))
  await screen.findByText('Current route path: "/two/{id:Int}"')
})
