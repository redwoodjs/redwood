/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react'

import { expectType, expectError } from 'tsd-lite'

import { Route } from '@redwoodjs/router'

describe('<Route/>', () => {
  /**
   * These tests don't need an expectation,
   * TS will do the checks as part of tsc,
   * the expectType is just to stop TS from complaining about unused vars
   */
  const TestPageComponent = () => <h1>This is a Page</h1>

  test('Standard props', () => {
    const route = <Route path="/" page={TestPageComponent} name="test" />
    expectType<JSX.Element>(route)
  })

  test('Redirect props', () => {
    const noName = <Route path="/" redirect="/test" />
    expectType<JSX.Element>(noName)

    const withName = <Route path="/" redirect="/test" name="bazinga" />
    expectType<JSX.Element>(withName)

    expectError()
  })

  test('NotFound page', () => {
    const standardNotFound = <Route notfound page={TestPageComponent} />
    expectType<JSX.Element>(standardNotFound)

    const notFoundWithName = (
      <Route notfound page={TestPageComponent} name="404-guy" />
    )
    expectType<JSX.Element>(notFoundWithName)

    // Should not be able to assign a redirect to not found
    expectError(<Route notfound page={TestPageComponent} redirect="/test" />)
  })
})
