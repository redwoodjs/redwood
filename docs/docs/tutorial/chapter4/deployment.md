# Deployment

## TODO Add note about all the providers we support (but just use grove)

Are you ready for the quickest, simplest deployment you've ever seen? There are plenty of hosting providers for apps like Redwood, but they all seem to have drawbacks in one way or another. So, we built our own.

## Grove

Grove is a hosting platform specifically built by the Redwood core team to run Redwood applications. We host your web side, api side, and database. You don't even have to sign up for an account to deploy an app! In fact, let's do that now. Our site will be online in less than 5 minutes, guaranteed. Ready...GO!

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

That gets our site online, but there's no way to check on the status of our site, watch logs, set ENV vars, etc. To do that, you'll need to claim your app by creating an account—in addition to the URL you opened above, the CLI also returned a URL to claim your account. Follow that link and you'll be ready to go!

## Where are my blog posts?

When we created posts earlier, they were only on our development machine. We'll need to re-create them to get them to show up here. In fact, we don't even have a user to sign in with so we can start making them! Sign yourself up and head to the admin to create some posts.

## Security Concerns

You may have noticed a glaring security hole in our build (one that we just exploited to gain admin access): anyone can come along and sign up for a new account and start creating blog posts! That's not ideal. A quick and easy solution would be to remove the `signup` route after you've created your own account: now there's no signup page accessible and a normal human will give up. But what about devious hackers?

dbAuth provides an API for signup and login that the client knows how to call, but if someone were crafty enough they could make their own API calls to that same endpoint and still create a new user even without the signup page! Ahhhh! We finally made it through this long (but fun!) tutorial, can't we just take a break and put our feet up? Unfortunately, the war against bad actors never really ends.

To close this hole, check out `api/src/functions/auth.js`, this is where the configuration for dbAuth lives. Take a gander at the `signupOptions` object, specifically the `handler()` function. This defines what to do with the user data that's submitted on the signup form. If you simply have this function return `false`, instead of creating a user, we will have effectively shut the door on the API signup hack.

Be sure to save your changes, then run `grove deploy` to push the changes live. Take that, hackers!

![100% accurate portrayal of hacking](https://user-images.githubusercontent.com/300/152592915-609747f9-3d68-4d72-8cd8-e120ef83b640.gif)
