---
sidebar_label: Firebase
---

# Firebase Authentication

To get started, run the setup command:

```bash
yarn rw setup auth firebase
```

This installs all the packages, writes all the files, and makes all the code modifications you need.
For a detailed explanation of all the api- and web-side changes that aren't exclusive to Firebase, see the top-level [Authentication](../authentication.md) doc.
For now, let's focus on Firebase's side of things.

If you don't have a Firebase account yet, now's the time to make one: navigate to https://firebase.google.com and click "Go to console"—it'll have you sign in or sign up if you haven't already—then create a project.
After it's ready, we'll get the API keys.

To get the API keys, we need to add a web app to our project.
Go ahead and do that (it's the main call to action on the dashboard—"Get started by adding Firebase to your app").
Give it a nickname, then you should see the API keys.
Since we're only using Firebase for auth, we only need `apiKey`, `authDomain`, and `projectId`.
Copy them into your project's `.env` file:

```bash title=".env"
FIREBASE_API_KEY="..."
FIREBASE_AUTH_DOMAIN="..."
FIREBASE_PROJECT_ID="..."
```

Lastly, include `FIREBASE_API_KEY` and `FIREBASE_AUTH_DOMAIN` in the list of env vars that should be available to the web side (`FIREBASE_PROJECT_ID` is for the api side):

```toml title="redwood.toml"
[web]
  # ...
  includeEnvironmentVariables = ["FIREBASE_API_KEY", "FIREBASE_AUTH_DOMAIN"]
```

We've hooked up our Firebase app to our Redwood app, but if you try it now, it won't work.
That's because we haven't actually enabled auth in our Firebase app yet.

Back to the dashboard one more time: in the nav on the left, click "Build", "Authentication", "Get started", and "Set up sign-in method".
We're going to go with "Email/Password" here, but feel free to configure things as you wish.
After clicking "Email/Password", enable it, and click "Save".

That should be enough; now, things should just work.
Let's make sure: if this is a brand new project, create a home page.
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
      <button onClick={() => signUp({
        // email: 'test@email.com'
        // password: 'test password
      })}>sign up</button>
    </>
  )
}

export default HomePage
```

If you click sign up, it'll seem like nothing happened. But if you go back to your Firebase app's dashboard, you should see a new user.
