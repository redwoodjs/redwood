import React from 'react'

import '@testing-library/jest-dom/extend-expect'
import { act, cleanup, render, screen } from '@testing-library/react'

import { navigate } from '../history'
import { Route, Router, routes } from '../router'

describe('Router scroll reset', () => {
  const Page1 = () => <div>Page 1</div>
  const Page2 = () => <div>Page 2</div>
  const TestRouter = () => (
    <Router>
      <Route path="/" page={Page1} name="page1" />
      <Route path="/two" page={Page2} name="page2" />
    </Router>
  )

  // Redfine the mocks here again (already done in jest.setup)
  // Otherwise the mock doesn't clear for some reason
  globalThis.scrollTo = jest.fn()

  beforeEach(async () => {
    ;(globalThis.scrollTo as jest.Mock).mockClear()
    render(<TestRouter />)

    // Make sure we're starting on the home route
    await screen.getByText('Page 1')
  })

  afterEach(async () => {
    // @NOTE: for some reason, the Router state does not reset between renders
    act(() => navigate('/'))
    cleanup()
  })

  it('resets on location/path change', async () => {
    act(() =>
      navigate(
        // @ts-expect-error - AvailableRoutes built in project only
        routes.page2()
      )
    )

    await screen.getByText('Page 2')

    expect(globalThis.scrollTo).toHaveBeenCalledTimes(1)
  })

  it('resets on location/path and queryChange change', async () => {
    act(() =>
      navigate(
        // @ts-expect-error - AvailableRoutes built in project only
        routes.page2({
          tab: 'three',
        })
      )
    )

    await screen.getByText('Page 2')

    expect(globalThis.scrollTo).toHaveBeenCalledTimes(1)
  })

  it('resets scroll on query params (search) change on the same page', async () => {
    act(() =>
      // We're staying on page 1, but changing the query params
      navigate(
        // @ts-expect-error - AvailableRoutes built in project only
        routes.page1({
          queryParam1: 'foo',
        })
      )
    )

    await screen.getByText('Page 1')

    expect(globalThis.scrollTo).toHaveBeenCalledTimes(1)
  })

  it('does NOT reset on hash change', async () => {
    await screen.getByText('Page 1')

    act(() =>
      // Stay on page 1, but change the hash
      navigate(`#route=66`, { replace: true })
    )

    await screen.getByText('Page 1')

    expect(globalThis.scrollTo).not.toHaveBeenCalled()
  })
})
