import React from 'react'
// We're bypassing the `main` field in `package.json` because we're
// replacing imports of `@redwoodjs/router` with this file, and not doing so
// would cause an infinite loop.
// See: ./packages/core/config/jest.config.web.js
export * from '@redwoodjs/router/dist/index'

export const routes: { [routeName: string]: () => string } = {}

/**
 * This is used in place of the real router during tests.
 * It populates the `routes.<pagename>()` utility object.
 */
export const Router: React.FunctionComponent = ({ children }) => {
  for (const route of React.Children.toArray(
    children
  ) as React.ReactElement[]) {
    const { name } = route.props
    routes[name] = jest.fn(() => name)
  }
  return <></>
}
