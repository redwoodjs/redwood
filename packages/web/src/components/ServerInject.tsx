import React, {
  Fragment,
  PropsWithChildren,
  ReactNode,
  useContext,
} from 'react'

/**
 *
 * Inspired by Next's useServerInsertedHTML, originally designed for CSS-in-JS
 * for now it seems the only way to inject html with streaming is to use a context
 *
 * Until https://github.com/reactjs/rfcs/pull/219 makes it into react
 *
 */

type RenderCallback = () => ReactNode

const insertCallbacks: Set<RenderCallback> = new Set([])

export const ServerHtmlContext = React.createContext<
  ((things: RenderCallback) => void) | null
>(null)

const injectToHead = (renderCallback: RenderCallback) => {
  insertCallbacks.add(renderCallback)
}

// @MARK: I don't know why Next don't do this also?
// My understanding: put the inject function in a context so that
// ServerInjectedHTML component rerenders, even though the state isn't inside the context
export const ServerHtmlProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  return (
    <ServerHtmlContext.Provider value={injectToHead}>
      {children}
    </ServerHtmlContext.Provider>
  )
}

export const ServerInjectedHtml = () => {
  const serverInsertedHtml = []
  for (const callback of insertCallbacks) {
    serverInsertedHtml.push(callback())

    // Remove it from the set so its not called again
    insertCallbacks.delete(callback)
  }

  // @MARK: using i as key here might be problematic, no?
  return serverInsertedHtml.map((html, i) => {
    return <Fragment key={i}>{html}</Fragment>
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
