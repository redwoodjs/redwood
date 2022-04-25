---
description: Render pages ahead of time
---

# Prerender

Some of your pages don't have dynamic content; it'd be great if you could render them ahead of time, making for a faster experience for your end users.

We thought a lot about what the developer experience should be for route-based prerendering. The result is one of the smallest APIs imaginable!

> **How's Prerendering different from SSR/SSG/SWR/ISSG/...?**
>
> As Danny said in his [Prerender demo](https://www.youtube.com/watch?v=iorKyMlASZc&t=2844s) at our Community Meetup, the thing all of these have in common is that they render your markup in a Node.js context to produce HTML. The difference is when (build or runtime) and how often.

<!-- [This comment](https://community.redwoodjs.com/t/prerender-proposal/849/12) on our Community forum. -->

## Prerendering a Page

Prerendering a page is as easy as it gets. Just add the `prerender` prop to the Route that you want to prerender:

```jsx {3} title="Routes.js"
<Route path="/" page={HomePage} name="home" prerender/>
```

Then run `yarn rw build` and enjoy the performance boost!

<!-- this doesn't render... -->
<!-- ![https://s3-us-west-2.amazonaws.com/secure.notion-static.com/b2c2aa27-3b2b-4ab7-b514-6ebc963d5312/2021-02-19_20.24.00.gif](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/b2c2aa27-3b2b-4ab7-b514-6ebc963d5312/2021-02-19_20.24.00.gif) -->

### Prerendering all pages in a Set

Just add the `prerender` prop to the Set that wraps all Pages you want to prerender:

```jsx {3} title="Routes.js"
<Set prerender>
  <Route path="/" page={HomePage} name="home" />
  <Route path="/about" page={AboutPage} name="hello" />
</Set>
```

### Not found page

You can also prerender your not found page (a.k.a your 404 page). Just add—you guessed it—the `prerender` prop:

```diff
-      <Route notfound page={NotFoundPage} />
+      <Route notfound page={NotFoundPage} prerender/>
```

This will prerender your NotFoundPage to `404.html` in your dist folder. Note that there's no need to specify a path.

## Cells, Private Routes, and Dynamic URLs

How does Prerendering handle dynamic data? For Cells, Redwood prerenders your Cells' `<Loading/>` component. Similarly, for Private Routes, Redwood prerenders your Private Routes' `whileLoadingAuth` prop:

```jsx {1,2}
<Private >
  // Loading is shown while we're checking to see if the user's logged in
  <Route path="/super-secret-admin-dashboard" page={SuperSecretAdminDashboard} name="ssad" whileLoadingAuth={() => <Loading />} prerender/>
</Private>
```

Right now prerendering won't work for dynamic URLs. We're working on this. If you try to prerender one of them, nothing will break, but nothing happens.

```jsx title="web/src/Routes.js"
<Route path="/blog-post/{id}" page={BlogPostPage} name="blogPost" prerender />
```

## Prerender Utils

Sometimes you need more fine-grained control over whether something gets prerendered. This may be because the component or library you're using needs access to browser APIs like `window` or `localStorage`. Redwood has three utils to help you handle these situations:

- `<BrowserOnly>`
- `useIsBrowser`
- `isBrowser`

> **Heads-up!**
>
> If you're prerendering a page that uses a third-party library, make sure it's "universal". If it's not, try calling the library after doing a browser check using one of the utils above.
>
> Look for these key words when choosing a library: _universal module, SSR compatible, server compatible_&mdash;all these indicate that the library also works in Node.js.

### `<BrowserOnly/>` component

This higher-order component is great for JSX:

```jsx
import { BrowserOnly } from '@redwoodjs/prerender/browserUtils'

const MyFancyComponent = () => {
  <h2>👋🏾 I render on both the server and the browser</h2>
  <BrowserOnly>
    <h2>🙋‍♀️ I only render on the browser</h2>
  </BrowserOnly>
}
```

### `useIsBrowser` hook

If you prefer hooks, you can use the `useIsBrowser` hook:

```jsx
import { useIsBrowser } from '@redwoodjs/prerender/browserUtils'

const MySpecialComponent = () => {
  const browser = useIsBrowser()

  return (
    <div className="my-4 p-5 rounded-lg border-gray-200 border">
      <h1 className="text-xl font-bold">Render info:</h1>

      {browser ? <h2 className="text-green-500">Browser</h2> : <h2 className="text-red-500">Prerendered</h2>}
    </div>
  )
}
```

### `isBrowser` boolean

If you need to guard against prerendering outside React, you can use the `isBrowser` boolean. This is especially handy when running initializing code that only works in the browser:

```jsx
import { isBrowser } from '@redwoodjs/prerender/browserUtils'

if (isBrowser) {
  netlifyIdentity.init()
}
```

### Optimization Tip

If you dynamically load third-party libraries that aren't part of your JS bundle, using these prerendering utils can help you avoid loading them at build time:

```jsx
import { useIsBrowser } from '@redwoodjs/prerender/browserUtils'

const ComponentUsingAnExternalLibrary = () => {
  const browser = useIsBrowser()

  // if `browser` evaluates to false, this won't be included
  if (browser) {
    loadMyLargeExternalLibrary()
  }

  return (
    // ...
  )
```

### Debugging

If you just want to debug your app, or check for possible prerendering errors, after you've built it, you can run this command:

```bash
yarn rw prerender --dry-run
```

Since we just shipped this in v0.26, we're actively looking for feedback! Do let us know if: everything built ok? you encountered specific libraries that you were using that didn’t work?

## Images and Assets

<!-- should name it... -->

Images and assets continue to work the way they used to. For more, see [this doc](assets-and-files.md).

Note that there's a subtlety in how SVGs are handled. Importing an SVG and using it in a component works great:

```jsx {1}
import logo from './my-logo.svg'

function Header() {
  return <logo />
}
```

But re-exporting the SVG as a component requires a small change:

```jsx
// ❌ due to how Redwood handles SVGs, this syntax isn't supported.
import Logo from './Logo.svg'
export default Logo
```

```jsx
// ✅ use this instead.
import Logo from './Logo.svg'

const LogoComponent = () => <Logo />

export default LogoComponent
```

## Configuring redirects

Depending on what pages you're prerendering, you may want to change your redirect settings. Using Netlify as an example:

<details>
<summary>If you prerender your `notFoundPage`
</summary>

You can remove the default redirect to index in your `netlify.toml`. This means the browser will accurately receive 404 statuses when navigating to a route that doesn't exist:

```diff
[[redirects]]
- from = "/*"
- to = "/index.html"
- status = 200
```

</details>

<details>

<summary>If you don't prerender your 404s, but prerender all your other pages</summary>
You can add a 404 redirect if you want:

```diff
[[redirects]]
  from = "/*"
  to = "/index.html"
- status = 200
+ status = 404
```

</details>

## Flash after page load

> We're actively working preventing these flashes with upcoming changes to the Router.

You might notice a flash after page load. A quick workaround for this is to make sure whatever page you're seeing the flash on isn't code split. You can do this by explicitly importing the page in `Routes.js`:

```jsx
import { Router, Route } from '@redwoodjs/router'
import HomePage from 'src/pages/HomePage'

const Routes = () => {
  return (
    <Router>
      <Route path="/" page={HomePage} name="hello" prerender />
      <Route path="/about" page={AboutPage} name="hello" />
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
```
