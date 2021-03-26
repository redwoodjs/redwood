import React, { ReactElement, ReactNode } from 'react'

import { Redirect } from './links'
import { useLocation } from './location'
import { usePrivate } from './private-context'
import { isRoute } from './router'
import { useRouterState } from './router-context'
import { flattenAll, matchPath } from './util'

type ReduceType = ReactElement | undefined

interface SetProps {
  wrap: unknown | unknown[]
  children: ReactNode
  [_: string]: unknown
}
export function Set(props: SetProps) {
  const { wrap, children, ...rest } = props
  const routerState = useRouterState()
  const location = useLocation()
  const { loading } = routerState.useAuth()
  const { isPrivate, unauthorized, unauthenticated } = usePrivate()

  const wrappers = Array.isArray(wrap) ? wrap : [wrap] // slap the wrappers in an array
  const flatChildArray = flattenAll(children)
  const routes = flatChildArray
    .filter(isRoute)
    .filter((r) => typeof r.props.path !== 'undefined')

  for (const route of routes) {
    const path = route.props.path as string

    const { match } = matchPath(path, location.pathname, routerState.paramTypes)
    if (match) {
      if (isPrivate && unauthorized()) {
        if (loading) {
          return route.props?.whileLoading?.() || null
        } else {
          const currentLocation =
            global.location.pathname +
            encodeURIComponent(global.location.search)

          const unauthenticatedRoute = routerState.routes.filter(
            ({ name }) => unauthenticated === name
          )[0]

          return (
            <Redirect
              to={`${unauthenticatedRoute.path}?redirectTo=${currentLocation}`}
            />
          )
        }
      }

      // Expand and nest the wrapped elements.
      return (
        wrappers.reduceRight<ReduceType>((acc, wrapper) => {
          return React.createElement(wrapper, rest, acc ? acc : children)
        }, undefined) || null
      )
    }
  }
  // No match, no render.
  return null
}
