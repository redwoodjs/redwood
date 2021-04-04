import React, { ReactElement, ReactNode, useCallback } from 'react'

import { Redirect } from './links'
import { useLocation } from './location'
import { isRoute } from './router'
import { useRouterState } from './router-context'
import { flattenAll, matchPath } from './util'

type WrapperType<WTProps> = (
  props: WTProps & { children: ReactNode }
) => ReactElement | null

type ReduceType = ReactElement | undefined

type SetProps<P> = P & {
  wrap?: WrapperType<P> | WrapperType<P>[]
  /**
   * `Routes` nested in a `<Set>` with `private` specified require
   * authentication. When a user is not authenticated and attempts to visit
   * the wrapped route they will be redirected to `unauthenticated` route.
   */
  private?: boolean
  /**
   * The page name where a user will be redirected when not authenticated
   * Defaults to redirect to '/' if not specified
   */
  unauthenticated?: string
  role?: string | string[]
  children: ReactNode
}

const IdentityWrapper: WrapperType<{}> = ({ children }) => {
  return <>{children}</>
}

export function Set<WrapperProps>(props: SetProps<WrapperProps>) {
  const {
    wrap,
    children,
    private: privateSet,
    unauthenticated,
    role,
    ...rest
  } = props
  const routerState = useRouterState()
  const location = useLocation()
  const { loading, isAuthenticated, hasRole } = routerState.useAuth()

  const unauthorized = useCallback(() => {
    return !(isAuthenticated && (!role || hasRole(role)))
  }, [isAuthenticated, role, hasRole])

  // Make sure `wrappers` is always an array with at least one wrapper component
  const wrappers = Array.isArray(wrap) ? wrap : [wrap ? wrap : IdentityWrapper]
  const flatChildArray = flattenAll(children)
  const routes = flatChildArray
    .filter(isRoute)
    .filter((r) => typeof r.props.path !== 'undefined')

  for (const route of routes) {
    const path = route.props.path as string

    const { match } = matchPath(path, location.pathname, routerState.paramTypes)
    if (!match) {
      continue
    }

    if (privateSet && unauthorized()) {
      if (loading) {
        return route.props?.whileLoading?.() || null
      } else {
        const currentLocation =
          global.location.pathname + encodeURIComponent(global.location.search)

        const unauthenticatedPath = routerState.routes.filter(
          ({ name }) => unauthenticated === name
        )[0]?.path || '/'

        return (
          <Redirect
            to={`${unauthenticatedPath}?redirectTo=${currentLocation}`}
          />
        )
      }
    }

    // Expand and nest the wrapped elements.
    return (
      wrappers.reduceRight<ReduceType>((acc, wrapper) => {
        return React.createElement(wrapper, {
          ...rest,
          children: acc ? acc : children,
        } as SetProps<WrapperProps>)
      }, undefined) || null
    )
  }

  // No match, no render.
  return null
}

interface PrivateProps {
  /** The page name where a user will be redirected when not authenticated */
  unauthenticated: string
  role?: string | string[]
}

/**
 * @deprecated Use `<Set private>` instead
 */
export const Private: React.FC<PrivateProps> = ({
  children,
  unauthenticated,
  role,
}) => {
  return (
    <Set private unauthenticated={unauthenticated} role={role}>
      {children}
    </Set>
  )
}
