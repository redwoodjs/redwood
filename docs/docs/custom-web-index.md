# Custom Web Index

You might've noticed that there's no call to `ReactDOM.render` anywhere in your Redwood App (`v0.26` and greater). That's because Redwood automatically mounts your `<App />` in `web/src/App.js` to the DOM. But if you need to customize how this happens, you can provide a file called `index.js` in `web/src` and Redwood will use that instead.

To make this easy to do, there's a setup command that'll give you the file you need where you need it: 

```
yarn rw setup custom-web-index
```

This generates a file named `index.js` in `web/src` that looks like this:

```js
// web/src/index.js

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

<!-- TODO: change link? -->
This is actually the same file Redwood uses [internally](https://github.com/redwoodjs/redwood/blob/main/packages/web/src/entry/index.js). So even if you don't customize anything any further than this, things will still work the way the should! 
