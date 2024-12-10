import type { ReactElement, ReactNode } from 'react'
import React from 'react'

import type { routes } from '@redwoodjs/router'

export type WrapperType<WTProps> = (
  props: Omit<WTProps, 'wrap' | 'children'> & {
    children: ReactNode
  },
) => ReactElement | null

type SetProps<P extends React.FC> = React.ComponentProps<P> & {
  /**
   * A react component that the children of the Set will be wrapped
   * in (typically a Layout component)
   */
  wrap?: P | P[]
  /**
   *`Routes` nested in a `<Set>` with `private` specified require
   * authentication. When a user is not authenticated and attempts to visit
   * the wrapped route they will be redirected to `unauthenticated` route.
   *
   * @deprecated Please use `<PrivateSet>` instead
   */
  private?: boolean
  /**
   * The page name where a user will be redirected when not authenticated
   *
   * @deprecated Please use `<PrivateSet>` instead and specify this prop there
   */
  unauthenticated?: keyof typeof routes
  /**
   * Route is permitted when authenticated and user has any of the provided
   * roles such as "admin" or ["admin", "editor"]
   */
  roles?: string | string[]
  /** Prerender all pages in the set */
  prerender?: boolean
  children: ReactNode
  /** Loading state for auth to distinguish with whileLoading */
  whileLoadingAuth?: () => ReactElement | null
  whileLoadingPage?: () => ReactElement | null
}

/**
 * A set containing public `<Route />`s
 */
export function Set<WrapperProps>(props: SetProps<WrapperProps>) {
  // @MARK: Virtual Component, this is actually never rendered
  // See analyzeRoutes in utils.tsx, inside the isSetNode block
  return <>{props.children}</>
}

type PrivateSetProps<P> = Omit<SetProps<P>, 'private' | 'unauthenticated'> & {
    /** The page name where a user will be redirected when not authenticated */
    unauthenticated: keyof typeof routes
  }

/** @deprecated Please use `<PrivateSet>` instead */
export function Private<WrapperProps>(props: PrivateSetProps<WrapperProps>) {
  // @MARK Virtual Component, this is actually never rendered
  // See analyzeRoutes in utils.tsx, inside the isSetNode block
  return <>{props.children}</>
}

/**
 * A set containing private `<Route />`s that require authentication to access
 */
export function PrivateSet<WrapperProps>(props: PrivateSetProps<WrapperProps>) {
  // @MARK Virtual Component, this is actually never rendered
  // See analyzeRoutes in utils.tsx, inside the isSetNode block
  return <>{props.children}</>
}

export const isSetNode = (
  node: ReactNode,
): node is ReactElement<SetProps<any>> => {
  return (
    React.isValidElement(node) &&
    (node.type === Set || node.type === PrivateSet || node.type === Private) &&
    // Don't even bother including Sets without children. They're useless.
    node.props.children
  )
}

export const isPrivateSetNode = (
  node: ReactNode,
): node is ReactElement<PrivateSetProps<unknown>> => {
  return React.isValidElement(node) && node.type === PrivateSet
}

// Only identifies <Private> nodes, not <Set private> nodes
export const isPrivateNode = (
  node: ReactNode,
): node is ReactElement<SetProps<any>> => {
  return React.isValidElement(node) && node.type === Private
}
