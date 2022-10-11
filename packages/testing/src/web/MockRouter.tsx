/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from 'react'

// Bypass the `main` field in `package.json` because we alias `@redwoodjs/router`
// for jest and Storybook. Not doing so would cause an infinite loop.
// See: ./packages/testing/config/jest/web/jest-preset.js
// @ts-ignore
import { isRoute, RouterProps } from '@redwoodjs/router/dist/router'
import { flattenAll, replaceParams } from '@redwoodjs/router/dist/util'
// @ts-ignore
export * from '@redwoodjs/router/dist/index'

export const routes: { [routeName: string]: () => string } = {}

/**
 * We overwrite the default `Router` export.
 * It populates the `routes.<pagename>()` utility object.
 */
export const Router: React.FC<RouterProps> = ({ children }) => {
  const flatChildArray = flattenAll(children)

  flatChildArray.forEach((child) => {
    if (isRoute(child)) {
      const { name, path } = child.props

      if (name && path) {
        routes[name] = (args = {}) => replaceParams(path, args)
      }
    }
  })

  return null
}
