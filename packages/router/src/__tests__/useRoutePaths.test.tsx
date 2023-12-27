/** @jest-environment jsdom */
import React from 'react'

import { render } from '@testing-library/react'

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

  const Layout = ({ children }: LayoutProps) => <>{children}</>

  const Page = () => <h1>Page</h1>

  const TestRouter = () => (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Set wrap={Layout}>
        <Route path="/one" page={Page} name="one" />
      </Set>
      <Set wrap={Layout}>
        <Route path="/two/{id:Int}" page={Page} name="two" />
      </Set>
    </Router>
  )

  const screen = render(<TestRouter />)

  await screen.findByText('Home Page')
  await screen.findByText(/^My path is\s+\/$/)
  await screen.findByText(/^All paths:\s+\/,\/one,\/two\/\{id:Int\}$/)
})
