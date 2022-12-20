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

If you don't have a Supabase account yet, now's the time to make one: navigate to https://supabase.com and click "Start your project" in the top right. Then sign in or sign up, and create an organization and a project.

While Supabase creates your project, it thoughtfully shows you your project's API keys.
(If the page refreshes while you're copying them over, just scroll down a bit and look for "Connecting to your new project".)
We're looking for are "Project URL" and "API key".
Copy them into your project's `.env` file.

There's one more we need, the "JWT Secret", that's not here.
To get that one, click the cog icon ("Project settings") near the bottom of the nav on the left.
Then click "API", scroll down a bit, and you should see it—"JWT Secret" under "JWT Settings".
All together now:

```bash title=".env"
SUPABASE_URL="..."
SUPABASE_KEY="..."
SUPABASE_JWT_SECRET="..."
```

Lastly, include `SUPABASE_URL` and `SUPABASE_KEY` in the list of env vars that should be available to the web side:

```toml title="redwood.toml"
[web]
  # ...
  includeEnvironmentVariables = ["SUPABASE_URL", "SUPABASE_KEY"]
```

That should be enough; now, things should just work.
Let's make sure: if this is a brand new project, create a home page.
There we'll destructure `signUp` from the `useAuth` hook (import that from `'src/auth'`):

```
yarn rw g page home /
```

```tsx title="web/src/pages/HomePage.tsx"
import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import { useAuth } from 'src/auth'

const HomePage = () => {
  const { signUp } = useAuth()

  return (
    <>
      {/* MetaTags, h1, paragraphs, etc. */}

      <button onClick={() => signUp({
        // email: 'test@email.com',
        // password: 'test password',
      })}>sign up</button>
    </>
  )
}

export default HomePage
```

Head back to your project's dashboard, click "Authentication" in the nav on the left, and you should see a new user.
