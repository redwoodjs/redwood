# OAuth

If you're using an auth provider like [Auth0](/docs/auth/auth0) then you'll get OAuth login automatically. But if you're using [dbAuth](/docs/auth/dbauth) you'll only have username/password login to start. But adding one or more OAuth clients isn't hard. This recipe will walk you through it from scratch, adding OAuth login via GitHub.

## Prerequisites

This article assumes you have an app set up and are using dbAuth. We're going to make use of the dbAuth system to validate that you're who you say you are. If you just want to try it out, you can create a test blog app from scratch by checking out the [Redwood codebase](https://github.com/redwoodjs/redwood) itself and then running this command:

```bash
# typescript
yarn run build:test-project ~/oauth-app

# javascript
yarn run build:test-project ~/oauth-app --javascript
```

That'll create a simple blog app at `~/oauth-app`. You'll get a login page, which we're going to enhance to include a "Login with GitHub" button.

Speaking of which, you'll also need a GitHub account so you can create an [OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app).

We also assume you're familiar with the basics of OAuth and the basic terminology surrounding it.

## Login Flow

Here's the logic flow we're going to implement:

1. User comes to the login page and clicks a "Login with GitHub" link.
2. The link directs the browser to GitHub's OAuth flow.
3. The user logs in with their GitHub credentials and approves our app.
4. The browser is redirected back to our app, to a new function `api/src/functions/oauth.js`.
5. The function fetches the oauth **access_token** with a call to GitHub, using the **code** that was included with the redirect from GitHub in the previous step.
6. When the **access_token** is received, the server then requests the user data from GitHub via another fetch.
7. The server the checks our database whether a user identified by GitHub's `id` already exists. If not, the `User` record is created using the info from the fetch in the previous step.
8. The user data from our own database is used to create the same cookie that dbAuth creates on a successful login.
9. The browser is redirected back to our site, and the user is now logged in.

## GitHub OAuth App Setup

In order to allow OAuth login with GitHub, we need to create an OAuth App. The instructions below are for creating one on your personal GitHub account, but if your app lives in a separate organization then you can perform the same steps under the org instead.

First go to your [Settings](https://github.com/settings/profile) and then the [Developer settings](https://github.com/settings/apps) at the bottom left. Finally, click the [OAuth Apps](https://github.com/settings/developers) nav item at left:

![OAuth app settings screenshot](https://user-images.githubusercontent.com/300/245297416-34821cb6-ace0-4a6a-9bf6-4e434d3cefc5.png)

Click [**New OAuth App**](https://github.com/settings/applications/new) and fill it in something like this:

![New OAuth app settings](https://user-images.githubusercontent.com/300/245298106-b35a6abe-6e8c-4ab1-8ab5-7b7e1dcc0a39.png)

The important part is the **Authorization callback URL** which is where GitHub will redirect you back once authenticated (step 4 of the login flow above). This callback URL assumes you're using the default function location of `/.redwood/functions`. If you've changed that in your app be sure to change it here as well.

Click **Register application** and then on the screen that follows, click the **Generate a new client secret** button:

![New client secret button](https://user-images.githubusercontent.com/300/245298639-6e08a201-b0db-4df6-975f-592544bdced7.png)

You may be asked to use your 2FA code to verify that you're who you say you are, but eventually you should see your new **Client secret**. Copy that, and the **Client ID** above it:

![Client secret](https://user-images.githubusercontent.com/300/245298897-129b5d00-3bed-4d7e-a40e-f4c9cda8a21f.png)

Add those to your app's `.env` file (or wherever you're managing your secrets). Note that it's best to have a different OAuth app on GitHub for each environment you deploy to. Consider this one the **dev** app, and you'll create a separate one with a different client ID and secret when you're ready to deploy to production:

```bash title=/.env
GITHUB_OAUTH_CLIENT_ID=41a08ae238b5aee4121d
GITHUB_OAUTH_CLIENT_SECRET=92e8662e9c562aca8356d45562911542d89450e1
```

We also need to denote what data we want permission to read from GitHub once someone authorizes our app. We'll want the user's public info, and probably their email address. That's only two scopes, and we can add those as another ENV var:


```bash title=/.env
GITHUB_OAUTH_CLIENT_ID=41a08ae238b5aee4121d
GITHUB_OAUTH_CLIENT_SECRET=92e8662e9c562aca8356d45562911542d89450e1
GITHUB_OAUTH_SCOPES="read:user user:email"
```

If you wanted access to more GitHub data, you can specify additional scopes here and they'll be listed to the user when they go to authorize your app. You can also change this list in the future, but you'll need to log the user out and the next time the click **Login with GitHub** they'll be asked to authorize your app again, with a new list of requested scopes.

One more ENV var, this is the same callback URL we told GitHub about. This is used in the link in the **Login with GitHub** button and gives GitHub another chance to verify that you're who you say you are: you're proving that you know where you're supposed to redirect back to:

```bash title=/.env
GITHUB_OAUTH_CLIENT_ID=41a08ae238b5aee4121d
GITHUB_OAUTH_CLIENT_SECRET=92e8662e9c562aca8356d45562911542d89450e1
GITHUB_OAUTH_SCOPES="read:user user:email"
GITHUB_OAUTH_REDIRECT_URI="http://localhost:8910/api/oauth/callback"
```

That's it for GitHub! From here on out we'll just be making changes to our app.

## The Login Button
