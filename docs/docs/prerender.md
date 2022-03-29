# Prerender

Some of your pages don't have dynamic content.
It'd be great if you could render them ahead of time, making for a faster experience for your end users.

We thought a lot about what the developer experience should be for route-based prerendering.
The result is one of the smallest APIs imaginable!

> **How's prerendering different from...**
>
> The thing all of these have in common is that they render your markup in a Node.js context to produce HTML.
> The difference is when (build or runtime) and how often.

<div class="video-container">
  <iframe src="https://www.youtube.com/embed/iorKyMlASZc" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; modestbranding; showinfo=0" allowfullscreen></iframe>
</div>

## Prerendering a Page

To prerender a page, just add the `prerender` prop to the Route that you want to prerender:

```jsx title="web/src/Routes.js"
<Route path="/" page={HomePage} name="home" prerender/>
```

Then run `yarn rw build` and enjoy the performance boost!

You can also add the `prerender` prop to a Set that wraps pages you want to prerender:

```jsx title="web/src/Routes.js"
// highlight-next-line
<Set prerender>
  <Route path="/" page={HomePage} name="home" />
  <Route path="/about" page={AboutPage} name="hello" />
</Set>
```

### Not found page

You can also prerender the `NotFoundPage`, (a.k.a 404) page.
Again, just add the `prerender` prop:

```jsx title="web/src/Routes.js"
<Route notfound page={NotFoundPage} prerender/>
```

This prerenders `NotFoundPage` to `404.html` in your dist folder.

## Cells, Private Routes, and Dynamic URLs

How does prerendering handle dynamic data?
For Cells, Redwood prerenders their `<Loading/>` component.
Similarly, for Private Routes, Redwood prerenders their `whileLoadingAuth` prop:

```jsx {7} title="web/src/Routes.js"
<Private >
  // Loading is shown while we're checking to see if the user's logged in
  <Route
    path="/super-secret-admin-dashboard"
    page={SuperSecretAdminDashboard}
    name="superSecretAdminDashboard"
    whileLoadingAuth={() => <Loading />}
    prerender
  />
</Private>
```

Right now prerendering won't work for dynamic URLs.
We're working on this.
If you try to prerender one of them, nothing will break, but nothing happens:

```jsx title="web/src/Routes.js"
<Route path="/blog-post/{id}" page={BlogPostPage} name="blogPost" prerender />
```

## Prerender Utils

Sometimes you need more fine-grained control over whether something gets prerendered.
For example, maybe the component or library you're using needs access to browser APIs like `window` or `localStorage`.
Redwood has three utilities to help you handle these situations:

- `BrowserOnly`
- `useIsBrowser`
- `isBrowser`

> **Heads-up!**
>
> If you're prerendering a page that uses a third-party library, make sure it's "universal".
> If it's not, try calling the library after doing a browser check using one of the utilities above.
>
> Look for these key words when choosing a library: _universal module, SSR compatible, server compatible.
> All these indicate that the library also works in Node.js.

### `BrowserOnly`

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

## Images and Assets

Images and assets continue to work the way they used to.
But note that there's a subtlety in how SVGs are handled.

Importing an SVG and using it in a component works the way you'd expect:

```jsx {1,4} title="web/src/components/Header/Header.js"
import Logo from './logo.svg'

function Header() {
  return <Logo />
}
```

But re-exporting an SVG as a component requires a small change:

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
