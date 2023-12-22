---
sidebar_label: SuperTokens
---

# SuperTokens Authentication

To get started, run the setup command:

```bash
yarn rw setup auth supertokens
```

This installs all the packages, writes all the files, and makes all the code modifications you need.
For a detailed explanation of all the api- and web-side changes that aren't exclusive to SuperTokens, see the top-level [Authentication](../authentication.md) doc.
For now, let's focus on SuperTokens's side of things.

When you run the setup command it configures your app to support both email+password logins as well as social auth logins (Apple, GitHub and Google). Working with those social auth logins does require quite a few environment variables. And SuperTokens itself needs a couple variables too. Thankfully SuperTokens makes this very easy to setup as they provide values we can use for testing.

So just copy this to your project's `.env` file.

```bash title=".env"
SUPERTOKENS_JWKS_URL=http://localhost:8910/.redwood/functions/auth/jwt/jwks.json

SUPERTOKENS_CONNECTION_URI=https://try.supertokens.io

SUPERTOKENS_APPLE_CLIENT_ID=4398792-io.supertokens.example.service
SUPERTOKENS_APPLE_SECRET_KEY_ID=7M48Y4RYDL
SUPERTOKENS_APPLE_SECRET_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgu8gXs+XYkqXD6Ala9Sf/iJXzhbwcoG5dMh1OonpdJUmgCgYIKoZIzj0DAQehRANCAASfrvlFbFCYqn3I2zeknYXLwtH30JuOKestDbSfZYxZNMqhF/OzdZFTV0zc5u5s3eN+oCWbnvl0hM+9IW0UlkdA\n-----END PRIVATE KEY-----
SUPERTOKENS_APPLE_SECRET_TEAM_ID=YWQCXGJRJL
SUPERTOKENS_GITHUB_CLIENT_ID=467101b197249757c71f
SUPERTOKENS_GITHUB_CLIENT_SECRET=e97051221f4b6426e8fe8d51486396703012f5bd
SUPERTOKENS_GOOGLE_CLIENT_ID=1060725074195-kmeum4crr01uirfl2op9kd5acmi9jutn.apps.googleusercontent.com
SUPERTOKENS_GOOGLE_CLIENT_SECRET=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
```

That should be enough; now, things should just work.
Let's make sure: if this is a brand new project, generate a home page.
There we'll try to sign up by destructuring `signUp` from the `useAuth` hook (import that from `'src/auth'`). We'll also destructure and display `isAuthenticated` to see if it worked:

```
yarn rw g page home /
```

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

export default HomePage
```

Clicking sign up should navigate you to `/auth` where SuperToken's default login/sign up UI is rendered.

<img width="463" height="696" alt="SuperTokens default UI" src="https://user-images.githubusercontent.com/30793/215893664-d367eb3d-566e-4541-a01a-5772d95cc9c7.png" />

After you sign up, you should be redirected back to your Redwood app, and you should see `{"isAuthenticated":true}` on the page.
