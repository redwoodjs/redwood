---
sidebar_label: Netlify
---

# Netlify Identity Authentication

To get started, run the setup command:

```bash
yarn rw setup auth netlify
```

This installs all the packages, writes all the files, and makes all the code modifications you need.
For a detailed explanation of all the api- and web-side changes that aren't exclusive to Netlify Identity, see the top-level [Authentication](../authentication.md) doc.
For now let's focus on Netlify's side of things.

There's a catch with Netlify Identity: your app has to be be deployed to Netlify to use it.
If this's a deal breaker for you, there are [other great auth providers to choose from](../authentication.md#official-integrations).
But here we'll assume it's not and that your app is already deployed.
(If it isn't, do that first, then come back. And yes, there's a setup command for that: `yarn rw setup deploy netlify`.)

Once you've deployed your app, go to it's overview, click "Identity", "Enable Identity", and copy the API endpoint in the Identity card.
(It should look something like `https://my-redwood-app.netlify.app/.netlify/identity`.)

Netlify Identity works a little differently than the other auth providers in that you don't have to copy API keys to your project's `.env` and `redwood.toml` files.
Instead, the first time you use it (by, say, calling `signUp` from `useAuth`), it'll ask you for your app's API endpoint.
So let's go ahead and use it: if this is a brand new project, create a home page.
There we'll destructure `signUp` from the `useAuth` hook (import that from `'src/auth'`):

```
yarn rw g page home /
```

```tsx title="web/src/pages/HomePage.tsx"
import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

// highlight-next-line
import { useAuth } from 'src/auth'

const HomePage = () => {
  // highlight-next-line
  const { signUp } = useAuth()

  return (
    <>
      {/* MetaTags, h1, paragraphs, etc. */}

      // highlight-next-line
      <button onClick={signUp}>sign up</button>
    </>
  )
}

export default HomePage
```

Clicking sign up should open a sign-up box; paste the API endpoint you copied earlier there:

<img width="1522" alt="image" src="https://user-images.githubusercontent.com/32992335/208788120-7dc7e544-8e83-42db-8110-a195f6e5ab41.png" />
