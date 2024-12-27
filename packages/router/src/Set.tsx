import type { ReactElement, ReactNode } from 'react'
import React from 'react'

import type { AvailableRoutes } from '@redwoodjs/router'

type RegularSetProps = {
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
  unauthenticated?: keyof AvailableRoutes
}

/**
 * A set containing public `<Route />`s
 */
export function Set<WrapperProps>(
  props: CommonSetProps<WrapperProps> & RegularSetProps,
) {
  // @MARK: Virtual Component, this is actually never rendered
  // See analyzeRoutes in utils.tsx, inside the isSetNode block
  return <>{props.children}</>
}

type CommonSetProps<P> = (P extends React.FC<any>
  ? React.ComponentProps<P>
  : P extends React.FC<any>[]
    ? React.ComponentProps<P[0]> &
        React.ComponentProps<P[1]> &
        React.ComponentProps<P[2]> &
        React.ComponentProps<P[3]> &
        React.ComponentProps<P[4]> &
        React.ComponentProps<P[5]> &
        React.ComponentProps<P[6]> &
        React.ComponentProps<P[7]> &
        React.ComponentProps<P[8]> &
        React.ComponentProps<P[9]>
    : unknown) & {
  /**
   * A React component, or an array of React components, that the children of
   * the Set will be wrapped in (typically a Layout component and/or a context)
   */
  wrap?: P
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

/** @deprecated Please use `<PrivateSet>` instead */
export function Private<WrapperProps>(
  props: CommonSetProps<WrapperProps> & {
    /** The page name where a user will be redirected when not authenticated */
    unauthenticated: keyof AvailableRoutes
  },
) {
  // @MARK Virtual Component, this is actually never rendered
  // See analyzeRoutes in utils.tsx, inside the isSetNode block
  return <>{props.children}</>
}

/**
 * A set containing private `<Route />`s that require authentication to access
 */
export function PrivateSet<WrapperProps>(
  props: CommonSetProps<WrapperProps> & {
    /** The page name where a user will be redirected when not authenticated */
    unauthenticated: keyof AvailableRoutes
  },
) {
  // @MARK Virtual Component, this is actually never rendered
  // See analyzeRoutes in utils.tsx, inside the isSetNode block
  return <>{props.children}</>
}

export const isSetNode = (
  node: ReactNode,
): node is ReactElement<CommonSetProps<any> & RegularSetProps> => {
  return (
    React.isValidElement(node) &&
    (node.type === Set || node.type === PrivateSet || node.type === Private) &&
    // Don't even bother including Sets without children. They're useless.
    node.props.children
  )
}

export const isPrivateSetNode = (
  node: ReactNode,
): node is ReactElement<
  CommonSetProps<unknown> & { unauthenticated: keyof AvailableRoutes }
> => {
  return React.isValidElement(node) && node.type === PrivateSet
}

// Only identifies <Private> nodes, not <Set private> nodes
export const isPrivateNode = (
  node: ReactNode,
): node is ReactElement<CommonSetProps<any> & RegularSetProps> => {
  return React.isValidElement(node) && node.type === Private
}
