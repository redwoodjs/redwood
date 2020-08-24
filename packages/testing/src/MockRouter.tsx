import React from 'react'
// Bypass the `main` field in `package.json` because we alias `@redwoodjs/router`
// for jest and Storybook. Not doing so would cause an infinite loop.
// See: ./packages/core/config/jest.config.web.js
// @ts-expect-error
import { Private, Route } from '@redwoodjs/router/dist/index'
// @ts-expect-error
export * from '@redwoodjs/router/dist/index'

export const routes: { [routeName: string]: () => string } = {}

const getPrivateRoutes = (children: React.ReactNode) =>
  (React.Children.toArray(children) as React.ReactElement[])
    .filter((child) => child.type === Private)
    .map((child) => child.props.children)
    .flat(Infinity)

/**
 * We overwrite the default `Router` export.
 * It populates the `routes.<pagename>()` utility object.
 */
export const Router: React.FunctionComponent = ({ children }) => {
  // get all children from <Private> blocks.
  const privateRoutes = getPrivateRoutes(children)

  const normalRoutes = (React.Children.toArray(
    children
  ) as React.ReactElement[]).filter((child) => child.type === Route)

  for (const child of [...privateRoutes, ...normalRoutes]) {
    const { name } = child.props
    routes[name] = () => name
  }
  return <></>
}
