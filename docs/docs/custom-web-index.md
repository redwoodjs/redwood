---
description: Change how App mounts to the DOM
---

# Custom Web Index

You may have noticed that there's no call to `ReactDOM.render` in your Redwood app.
That's because Redwood automatically mounts the `App` component in `web/src/App.js` to the DOM.
But if you need to customize how this happens, you can provide a file named `index.js` in `web/src` and Redwood will use that instead.

## Setup

To make this easy, there's a setup command that'll give you the file you need where you need it:

```
yarn rw setup custom-web-index
```

This generates a file named `index.js` in `web/src` that looks like this:

```jsx title="web/src/index.js"
import ReactDOM from 'react-dom'

import App from './App'
/**
 * When `#redwood-app` isn't empty then it's very likely that you're using
 * prerendering. So React attaches event listeners to the existing markup
 * rather than replacing it.
 * https://reactjs.org/docs/react-dom.html#hydrate
 */
const rootElement = document.getElementById('redwood-app')

if (rootElement.hasChildNodes()) {
  ReactDOM.hydrate(<App />, rootElement)
} else {
  ReactDOM.render(<App />, rootElement)
```

This's actually the same file Redwood uses [internally](https://github.com/redwoodjs/redwood/blob/main/packages/web/src/entry/index.js).
So even if you don't customize anything, things still work the way they did.
