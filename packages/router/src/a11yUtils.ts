/**
 * gets the announcement for the new page.
 * called in page-loader's `componentDidUpdate`.
 *
 * the order of priority is:
 * 1. RouteAnnouncement (the most specific one)
 * 2. h1
 * 3. document.title
 * 4. location.pathname
 */
export const getAnnouncement = () => {
  const routeAnnouncement = global?.document.querySelectorAll(
    '[data-redwood-route-announcement]'
  )?.[0]
  if (routeAnnouncement?.textContent) {
    return routeAnnouncement.textContent
  }

  const pageHeading = global?.document.querySelector(`h1`)
  if (pageHeading?.textContent) {
    return pageHeading.textContent
  }

  if (global?.document.title) {
    return document.title
  }

  return `new page at ${global?.location.pathname}`
}

export const getFocus = () => {
  const routeFocus = global?.document.querySelectorAll(
    '[data-redwood-route-focus]'
  )?.[0]

  if (
    !routeFocus ||
    !routeFocus.children.length ||
    (routeFocus.children[0] as HTMLElement).tabIndex < 0
  ) {
    return null
  }

  return routeFocus.children[0] as HTMLElement
}

// note: tried document.activeElement.blur(), but that didn't reset the focus flow
export const resetFocus = () => {
  global?.document.body.setAttribute('tabindex', '-1')
  global?.document.body.focus()
  global?.document.body.removeAttribute('tabindex')
}

export interface Spec {
  name: string
  loader: () => Promise<{ default: React.ComponentType<unknown> }>
}

export function isSpec(
  specOrPage: Spec | React.ComponentType
): specOrPage is Spec {
  return (specOrPage as Spec).loader !== undefined
}
