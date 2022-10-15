---
description: How to include assets—like images—in your app
---

# Assets and Files

There are two ways to add an asset to your Redwood app:

1. co-locate it with the component using it and import it into the component as if it were code
2. add it to the `web/public` directory and reference it relative to your site's root

Where possible, prefer the first strategy.
It lets webpack include the asset in the bundle, opting-in to all of webpack's benefits.

### Co-locating and Importing Assets

Let's say you want to show your app's logo in your `Header` component.
First, add your logo to the `Header` component's directory:

```text
web/src/components/Header/
// highlight-next-line
├── logo.png
├── Header.js
├── Header.stories.js
└── Header.test.js
```

Then, in the `Header` component, import your logo as if it were code:

```jsx title="web/src/components/Header/Header.js"
// highlight-next-line
import logo from './logo.png'

const Header = () => {
  return (
    <header>
      {/* ... */}
      // highlight-next-line
      <img src={logo} alt="Logo" />
    </header>
  )
}

export default Header
```

If you're curious how this works, see the webpack docs on [asset management](https://webpack.js.org/guides/asset-management/).

## Adding to the `web/public` Directory

You can also add assets to the `web/public` directory, effectively adding static files to your app.
During dev and build, Redwood copies `web/public`'s contents into `web/dist`.

> Changes to `web/public` don't hot-reload.

Again, because assets in this directory don't go through webpack, **use this strategy sparingly**, and mainly for assets like favicons, manifests, `robots.txt`, libraries incompatible with webpack—etc.

### Example: Adding Your Logo and Favicon to `web/public`

Let's say that you've added your logo and favicon to `web/public`:

```
web/public/
├── img/
│  └── logo.png
└── favicon.png
```

When you run `yarn rw dev` and `yarn rw build`, Redwood copies
`web/public/img/logo.png` to `web/dist/img/logo.png` and `web/public/favicon.png` to `web/dist/favicon.png`:

```text
web/dist/
├── static/
│  ├── js/
│  └── css/
// highlight-start
├── img/
│  └── logo.png
└── favicon.png
// highlight-end
```

You can reference these files in your code without any special handling:

```jsx title="web/src/components/Header/Header.js"
import { Head } from '@redwoodjs/web'

const Header = () => {
  return (
    <>
      <Head>
        // highlight-next-line
        <link rel="icon" type="image/png" href="favicon.png" />
      </Head>
      // highlight-next-line
      <img src="img/logo.png" alt="Logo" />
    </>
  )
}

export default Header
```
