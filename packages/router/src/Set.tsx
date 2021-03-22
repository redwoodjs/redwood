import React, { ReactElement, ReactNode, FunctionComponentElement } from 'react'

import { useLocation } from './location'
import { isRoute } from './router'
import { useRouterState } from './router-context'
import { flattenAll, matchPath } from './util'

interface PropsWithChildren {
  children: ReactNode
}

type WrapperType = (props: { children: any }) => ReactElement | null
type ReduceType = FunctionComponentElement<PropsWithChildren> | undefined

interface Props {
  wrap: WrapperType | WrapperType[]
  children: ReactNode
}

export const Set: React.FC<Props> = ({ children, wrap }) => {
  const routerState = useRouterState()
  const location = useLocation()
  const wrappers = Array.isArray(wrap) ? wrap : [wrap]

  const flatChildArray = flattenAll(children)

  const matchingChildRoute = flatChildArray.some((child) => {
    if (isRoute(child)) {
      const { path } = child.props

      if (path) {
        const { match } = matchPath(
          path,
          location.pathname,
          routerState.paramTypes
        )

        if (match) {
          return true
        }
      }
    }

    return false
  })

  return matchingChildRoute
    ? wrappers.reduceRight<ReduceType>((acc, wrapper) => {
        return React.createElement(wrapper, undefined, acc ? acc : children)
      }, undefined) || null
    : null
}
