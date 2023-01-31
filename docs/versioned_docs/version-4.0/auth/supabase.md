---
sidebar_label: Supabase
---

# Supabase Authentication

To get started, run the setup command:

```bash
yarn rw setup auth supabase
```

<!-- vA47SZpaCR7BinC9 -->

This installs all the packages, writes all the files, and makes all the code modifications you need.
For a detailed explanation of all the api- and web-side changes that aren't exclusive to Supabase, see the top-level [Authentication](../authentication.md) doc. For now, let's focus on Supabase's side of things.

If you don't have a Supabase account yet, now's the time to make one: navigate to https://supabase.com and click "Start your project" in the top right. Then sign up and create an organization and a project.

While Supabase creates your project, it thoughtfully shows your project's API keys.
(If the page refreshes while you're copying them over, just scroll down a bit and look for "Connecting to your new project".)
We're looking for "Project URL" and "API key" (the `anon`, `public` one).
Copy them into your project's `.env` file as `SUPABASE_URL` and `SUPABASE_KEY` respectively.

There's one more we need, the "JWT Secret", that's not here.
To get that one, click the cog icon ("Project Settings") near the bottom of the nav on the left.
Then click "API", scroll down a bit, and you should see it—"JWT Secret" under "JWT Settings".
Copy it into your project's `.env` file as `SUPABASE_JWT_SECRET`.
All together now:

```bash title=".env"
SUPABASE_URL="..."
SUPABASE_KEY="..."
SUPABASE_JWT_SECRET="..."
```

Lastly, in `redwood.toml`, include `SUPABASE_URL` and `SUPABASE_KEY` in the list of env vars that should be available to the web side:

```toml title="redwood.toml"
[web]
  # ...
  includeEnvironmentVariables = ["SUPABASE_URL", "SUPABASE_KEY"]
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
      <button onClick={() => signUp({
        // email: 'your.email@email.com',
        // password: 'super secret password',
      })}>sign up</button>
    </>
  )
}
```

Supabase doesn't redirect to a hosted sign-up page or open a sign-up modal.
In a real app, you'd build a form here, but we're going to hardcode an email and password.
After you sign up, head to your inbox: there should be a confirmation email from Supabase waiting for you.
Click the link, then head back to your app.
Once you refresh the page, you should see `{"isAuthenticated":true}` on the page.
