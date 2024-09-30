# Deployment

Are you ready for the quickest, simplest deployment you've ever seen? There are plenty of hosting providers for apps like Redwood, but they all seem to have drawbacks in one way or another. So, we built our own.

## Grove

Grove is a hosting platform specifically built by the Redwood core team to run Redwood applications. We host your web side, api side, and database. You don't even have to sign up for an account to deploy an app! In fact, let's do that now. Our site will be online in less than 5 minutes, guaranteed. Ready...GO!

:::info More Deployment Options

Out of the box, Redwood can deploy to a whole range of hosting providers including:

- [Baremetal](/docs/deploy/baremetal) (physical server that you have SSH access to)
- [Coherence](/docs/deploy/coherence)
- [Flightcontrol](/docs/deploy/flightcontrol)
- [Netlify](/docs/deploy/netlify)
- [Render](/docs/deploy/render)
- [Vercel](/docs/deploy/vercel)

We're going with Grove here because it's the simplest and easiest for a Redwood app.

:::

:::danger Grove is in alpha!

Grove is currently under development and is not meant to your production-ready application!

:::

## Install the CLI

You'll only need to do this once, and then you'll have the `grove` CLI command and can deploy any Redwood app directly from your development machine:

```bash
curl -L https://install.grove.dev | sh
```

That will download a simple bash script and then run it, installing the Grove CLI tool, which is written in Go.

## Deploy

From the root of your app, just run:

```bash
grove deploy
```

Yes, that's it. Once the command is complete, your site is live!

```bash
$% grove deploy
   ____ __________ _   _____  | ## Alpha Version ##
  / __ `/ ___/ __ \ | / / _ \ |
 / /_/ / /  / /_/ / |/ /  __/ | The world's greatest
 \__, /_/   \____/|___/\___/  | hosting platform for
/____/                        | RedwoodJS projects

Deploying [beautiful fragrant tree]
[✓] Pre-deploy checks
[✓] Creating new application
[✓] Syncing code
[✓] Deploying

Deploy complete!
- URL: https://beautiful-fragrant-tree.grove.run
- Claim: https://grove.dev/claim/clm-flpp30l3berhj8uca95xpdaw
```

Copy the URL from the output and open it in your browser:

![image](https://user-images.githubusercontent.com/300/145901020-1c33bb74-78f9-415e-a8c8-c8873bd6630f.png)

## What just happened?

Grove collected all the code for your app and sent it to a "builder" container to actually build the app. It created a database and replaced your `DATABASE_URL` connection string with an instance of SQLite running internally. It transfered the built RedwoodJS app to a "runner" container and connected it to the internet at the funny URL above!

## Claiming Your App

That gets our site online, but there's no way to check on the status of our site, watch logs, set ENV vars, etc. To do that, you'll need to claim your app by creating an account—in addition to the URL you opened above, the CLI also returned a URL to claim your account. Follow that second link from the deploy output, create a login (or use GitHub) and you should see your Grove dashboard:

![grove dashboard](/img/tutorial/grove-dashboard.png)

To link the Grove CLI to your claimed app, run the following:

```bash
grove login
```

You'll be taken to your browser to authorize access. Now your `grove` CLI is now tied to your account. You'll still need to go to the "Claim" URL any time you deploy a _new_ app, but you won't have to login again.

:::info Error on redeploy?

When trying to re-deploy an app that you have claimed, you'll need to have run `grove login` first so we know that you have permission to deploy to that host again!

:::

You may notice a big scary red timer at the top of your dashboard! This is a countdown until your site expires. While Grove is in alpha/beta we are only allowing sites to persist for 48 hours (but that should be plenty of time to finish the tutorial, RIGHT?). Soon, we will extend this timer and we will notify Grove members when that time comes. In the meantime, if you do need more time for your app, you can contact us at [support@grove.dev](mailto:support@grove.dev?subject=I%20need%20more%20time!&body=I%20could%20use%20a%20little%20more%20time%20on%20my%20Grove%20site:%20[subdomain].grove.dev) with your app's subdomain and we can extend your time!

## Where are my blog posts?

When we created posts earlier, they were only on our development machine. We'll need to re-create them to get them to show up here. In fact, we don't even have a user to sign in with so we can start making them! Sign yourself up and head to the admin to create some posts.

## Security Concerns

You may have noticed a glaring security hole in our build (one that we just exploited to gain admin access): anyone can come along and sign up for a new account and start creating blog posts! That's not ideal. A quick and easy solution would be to remove the `signup` route after you've created your own account: now there's no signup page accessible and a normal human will give up. But what about devious hackers?

dbAuth provides an API for signup and login that the client knows how to call, but if someone were crafty enough they could make their own API calls to that same endpoint and still create a new user even without the signup page! Ahhhh! We finally made it through this long (but fun!) tutorial, can't we just take a break and put our feet up? Unfortunately, the war against bad actors never really ends.

To close this hole, check out `api/src/functions/auth.js`, this is where the configuration for dbAuth lives. Take a gander at the `signupOptions` object, specifically the `handler()` function. This defines what to do with the user data that's submitted on the signup form. If you simply have this function return `false`, instead of creating a user, we will have effectively shut the door on the API signup hack:

```js
const signupOptions = {
  // highlight-start
  handler: () => {
    return false
  },
  // highlight-end

  // ...
```

The signup page itself is still visible, however. To remove it completely, remove the `<Route>` in the Router, and remove the "Don't have an acocunt? Sign up!" link on the login page.

Be sure to save your changes, then run `grove deploy` to push the changes live. Take that, hackers!

![100% accurate portrayal of hacking](https://user-images.githubusercontent.com/300/152592915-609747f9-3d68-4d72-8cd8-e120ef83b640.gif)
