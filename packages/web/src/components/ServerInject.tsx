import React, { Fragment, ReactNode, useContext, useId } from 'react'

/**
 *
 * Inspired by Next's useServerInsertedHTML, originally designed for CSS-in-JS
 * for now it seems the only way to inject html with streaming is to use a context
 *
 * We use this for <head> tags, and for apollo cache hydration
 *
 * Until https://github.com/reactjs/rfcs/pull/219 makes it into react
 *
 */

export type RenderCallback = () => ReactNode

export const ServerHtmlContext = React.createContext<
  ((things: RenderCallback) => void) | null
>(null)

/**
 *
 *  Use this factory, once per request.
 *  This is to ensure that injectionState is isolated to the request
 *  and not shared between requests.
 */
export const createInjector = () => {
  const injectionState: Set<RenderCallback> = new Set([])

  const injectToPage = (renderCallback: RenderCallback) => {
    injectionState.add(renderCallback)
  }

  return { injectToPage, injectionState }
}

// @NOTE do not instatiate the provider value here, so that we can ensure
// context isolation. This is done in streamHelpers currently,
// using the createInjector factory, once per request
export const ServerHtmlProvider = ServerHtmlContext.Provider

export const ServerInjectedHtml = ({
  injectionState,
}: {
  injectionState: Set<RenderCallback>
}) => {
  const serverInsertedHtml = []
  for (const callback of injectionState) {
    serverInsertedHtml.push(callback())

    // Remove it from the set so its not rendered again
    injectionState.delete(callback)
  }

  const fragmentId = useId()

  return serverInsertedHtml.map((html, i) => {
    return (
      <Fragment key={`rw-server-inserted-${fragmentId}-${i}`}>{html}</Fragment>
    )
  })
}

// Exactly the same as Next's useServerInsertedHTML
export function useServerInsertedHTML(callback: () => React.ReactNode): void {
  const addInsertedServerHTMLCallback = useContext(ServerHtmlContext)

  // Should have no effects on client where there's no flush effects provider
  if (addInsertedServerHTMLCallback) {
    addInsertedServerHTMLCallback(callback)
  }
}

// @TODO use this in streamHelpers final block
export const AppendToHead = ({ tagsToAppend }: { tagsToAppend: string }) => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document?.head.append(${tagsToAppend})`,
      }}
    />
  )
}
