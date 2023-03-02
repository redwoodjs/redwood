---
sidebar_label: Clerk
---

# Clerk Authentication

To get started, run the setup command:

```text
yarn rw setup auth clerk
```

This installs all the packages, writes all the files, and makes all the code modifications you need.
For a detailed explanation of all the api- and web-side changes that aren't exclusive to Clerk, see the top-level [Authentication](../authentication.md) doc.
There's one Clerk-specific thing we'll get to, but for now, let's focus on Clerk's side of things.

If you don't have a Clerk account yet, now's the time to make one: navigate to https://clerk.dev, sign up, and create an application.
The defaults are good enough to get us going, but feel free to configure things as you wish.
We'll get the application's API keys from its dashboard next.

:::note we'll only focus on the development instance

By default, Clerk applications have two instances, "Development" and "Production".
We'll only focus on the "Development" instance here, which is used for local development.
When you're ready to deploy, switch the instance the dashboard is displaying by clicking "Development" in the header at the top.
How you get your API keys to production depends on your deploy provider.

:::

We're looking for two API keys.
Head over to the "Developers" section in the nav on the left and click "API Keys". Finally select RedwoodJS in the Framework dropdown in the Quick Copy section.
Do as it says and copy the two keys into your project's `.env` file:

```bash title=".env"
CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."
```

Lastly, in your project's `redwood.toml` file, include `CLERK_PUBLISHABLE_KEY` in the list of env vars that should be available to the web side:

```toml title="redwood.toml"
[web]
  # ...
  includeEnvironmentVariables = ["CLERK_PUBLISHABLE_KEY"]
```

That should be enough; now, things should just work.
Let's make sure: if this is a brand new project, generate a home page.
There we'll try to sign up by destructuring `signUp` from the `useAuth` hook (import that from `'src/auth'`). We'll also destructure and display `isAuthenticated` to see if it worked:

```tsx title="web/src/pages/HomePage.tsx"
import { useAuth } from 'src/auth'

const HomePage = () => {
  const { isAuthenticated, signUp } = useAuth()

  return (
    <>
      {/* MetaTags, h1, paragraphs, etc. */}

      <p>{JSON.stringify({ isAuthenticated })}</p>
      <button onClick={signUp}>sign up</button>
    </>
  )
}
```

Clicking sign up should open a sign-up box:

<img width="1522" alt="image" src="https://user-images.githubusercontent.com/32992335/208342825-b380f8f8-7b76-4be9-a0a5-e64740a03bd3.png" />

After you sign up, you should see `{"isAuthenticated":true}` on the page.

## Deep dive: the `ClerkStatusUpdater` component

At the start of this doc, we said that there's one Clerk-specific thing worth noting.
We'll discuss it here, but feel free to skip this section if you'd like—this is all extracurricular.

Clerk is a bit unlike the other auth providers Redwood integrates with in that it puts an instance of its client SDK on the browser's `window` object.
That means we have to wait for it to be ready.
With other providers, we instantiate their client SDK in `web/src/auth.ts`, then pass it to `createAuth`.
Not so with Clerk—instead we use special Clerk components and hooks, like `ClerkLoaded` and `useUser`, to update Redwood's auth context with the client when it's ready.

## Avoiding feature duplication

Redwood's Clerk integration is based on [Clerk's React SDK](https://clerk.dev/docs/reference/clerk-react/installation).
This means that there's some duplication between the features in the SDK and the ones in `@redwoodjs/auth-clerk-web`.
For example, the SDK ha a `SignedOut` component that redirects a user away from a private page—very much like wrapping a route with Redwood's `Private` component.
We recommend you use Redwood's way of doing things as much as possible since it's much more likely to get along with the rest of the framework.
