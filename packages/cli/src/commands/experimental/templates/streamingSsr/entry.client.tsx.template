import { hydrateRoot, createRoot } from 'react-dom/client'

import App from './App'
import { Document } from './Document'

/**
 * When `#redwood-app` isn't empty then it's very likely that you're using
 * prerendering. So React attaches event listeners to the existing markup
 * rather than replacing it.
 * https://reactjs.org/docs/react-dom-client.html#hydrateroot
 */
const redwoodAppElement = document.getElementById('redwood-app')

if (redwoodAppElement.children?.length > 0) {
  hydrateRoot(
    document,
    <Document css={window.__assetMap?.()?.css}>
      <App />
    </Document>
  )
} else {
  const root = createRoot(document)
  root.render(
    <Document css={window.__assetMap?.()?.css}>
      <App />
    </Document>
  )
}
