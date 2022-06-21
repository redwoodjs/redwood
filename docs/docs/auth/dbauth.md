---
sidebar_label: Self-hosted (dbAuth)
---

# Self-hosted Authentication (dbAuth)

Redwood's own **dbAuth** provides several benefits:

- Use your own database for storing user credentials
- Use your own login, signup and forgot password pages (or use Redwood's pre-built ones)
- Customize login session length
- No external dependencies
- No user data ever leaves your servers
- No additional charges/limits based on number of users
- No third party service outages affecting your site

And potentially one large drawback:

- Use your own database for storing user credentials

However, we're following best practices for storing these credentials:

1. Users' passwords are [salted and hashed](https://auth0.com/blog/adding-salt-to-hashing-a-better-way-to-store-passwords/) with PBKDF2 before being stored
2. Plaintext passwords are never stored anywhere, and only transferred between client and server during the login/signup phase (and hopefully only over HTTPS)
3. Our logger scrubs sensitive parameters (like `password`) before they are output

Even if you later decide you want to let someone else handle your user data for you, dbAuth is a great option for getting up and running quickly (we even have a generator for creating basic login and signup pages for you).

## How It Works

dbAuth relies on good ol' fashioned cookies to determine whether a user is logged in or not. On an attempted login, a serverless function on the api-side checks whether a user exists with the given username (internally, dbAuth refers to this field as _username_ but you can use anything you want, like an email address). If a user with that username is found, does their salted and hashed password match the one in the database?

If so, an [HttpOnly](https://owasp.org/www-community/HttpOnly), [Secure](https://owasp.org/www-community/controls/SecureCookieAttribute), [SameSite](https://owasp.org/www-community/SameSite) cookie (dbAuth calls this the "session cookie") is sent back to the browser containing the ID of the user. The content of the cookie is a simple string, but AES encrypted with a secret key (more on that later).

When the user makes a GraphQL call, we decrypt the cookie and make sure that the user ID contained within still exists in the database. If so, the request is allowed to proceed.

If there are any shenanigans detected (the cookie can't be decrypted properly, or the user ID found in the cookie does not exist in the database) the user is immediately logged out by expiring the session cookie.

## Setup

A single CLI command will get you everything you need to get dbAuth working, minus the actual login/signup pages:

```bash
yarn rw setup auth dbAuth
```
    
An optional add-on to dbAuth enables **WebAuthn** authentication (TouchID, FaceID, etc.). If you think you want to use WebAuthn, you can generate the necessary fields right from the start by adding a `--webAuthn` flag to the above command:

```bash
yarn rw setup auth dbAuth --webAuthn
```

You can also add WebAuthn to an existing dbAuth install.  [Read more about WebAuthn usage and config below](#webauthn).

Read the post-install instructions carefully as they contain instructions for adding database fields for the hashed password and salt, as well as how to configure the auth serverless function based on the name of the table that stores your user data. Here they are, but could change in future releases:

> You will need to add a couple of fields to your User table in order to store a hashed password and salt:
>
>     model User {
>       id             Int @id @default(autoincrement())
>       email          String  @unique
>       hashedPassword      String    // <─┐
>       salt                String    // <─┼─ add these lines
>       resetToken          String?   // <─┤
>       resetTokenExpiresAt DateTime? // <─┘
>     }
>
> If you already have existing user records you will need to provide a default value or Prisma complains, so change those to:
>
>     hashedPassword String @default("")
>     salt           String @default("")
>
> You'll need to let Redwood know what field you're using for your users' `id` and `username` fields In this case we're using `id` and `email`, so update those in the `authFields` config in `/api/src/functions/auth.js` (this is also the place to tell Redwood if you used a different name for the `hashedPassword` or `salt` fields):
>
>     authFields: {
>       id: 'id',
>       username: 'email',
>       hashedPassword: 'hashedPassword',
>       salt: 'salt',
>       resetToken: 'resetToken',
>       resetTokenExpiresAt: 'resetTokenExpiresAt',
>     },
>
> To get the actual user that's logged in, take a look at `getCurrentUser()` in `/api/src/lib/auth.js`. We default it to something simple, but you may use different names for your model or unique ID fields, in which case you need to update those calls (instructions are in the comment above the code).
>
> Finally, we created a `SESSION_SECRET` environment variable for you in `.env`. This value should NOT be checked into version control and should be unique for each environment you deploy to. If you ever need to log everyone out of your app at once change this secret to a new value. To create a new secret, run:
>
>     yarn rw g secret
>
> Need simple Login, Signup and Forgot Password pages? Of course we have a generator for those:
>
>     yarn rw generate dbAuth

Note that if you change the fields named `hashedPassword` and `salt`, and you have some verbose logging in your app, you'll want to scrub those fields from appearing in your logs. See the [Redaction](logger.md#redaction) docs for info.

## Scaffolding Login/Signup/Forgot Password Pages

If you don't want to create your own login, signup and forgot password pages from scratch we've got a generator for that:

```bash
yarn rw g dbAuth
```

Just like for `setup` you can have Redwood generate [WebAuthn-enabled](#webauthn) pages for you:

```bash
yarn rw g dbAuth --webAuthn
```

The default routes will make them available at `/login`, `/signup`, `/forgot-password`, and `/reset-password` but that's easy enough to change. Again, check the post-install instructions for one change you need to make to those pages: where to redirect the user to once their login/signup is successful.

If you'd rather create your own, you might want to start from the generated pages anyway as they'll contain the other code you need to actually submit the login credentials or signup fields to the server for processing.

## Configuration

Almost all config for dbAuth lives in `api/src/functions/auth.js` in the object you give to the `DbAuthHandler` initialization. The comments above each key will explain what goes where. Here's an overview of the more important options:

### login.handler()

If you want to do something other than immediately let a user log in if their username/password is correct, you can add additional logic in `login.handler()`. For example, if a user's credentials are correct, but they haven't verified their email address yet, you can throw an error in this function with the appropriate message and then display it to the user. If the login should proceed, simply return the user that was passed as the only argument to the function:

```jsx
login: {
  handler: (user) => {
    if (!user.verified) {
      throw new Error('Please validate your email first!')
    } else {
      return user
    }
  }
}
```

### signup.handler()

This function should contain the code needed to actually create a user in your database. You will receive a single argument which is an object with all of the fields necessary to create the user (`username`, `hashedPassword` and `salt`) as well as any additional fields you included in your signup form in an object called `userAttributes`:

```jsx
signup: {
  handler: ({ username, hashedPassword, salt, userAttributes }) => {
    return db.user.create({
      data: {
        email: username,
        hashedPassword: hashedPassword,
        salt: salt,
        name: userAttributes.name,
      },
    })
  }
}
```

Before `signup.handler()` is invoked, dbAuth will check that the username is unique in the database and throw an error if not.

There are three things you can do within this function depending on how you want the signup to proceed:

1. If everything is good and the user should be logged in after signup: return the user you just created
2. If the user is safe to create, but you do not want to log them in automatically: return a string, which will be returned by the `signUp()` function you called after destructuring it from `useAuth()` (see code snippet below)
3. If the user should _not_ be able to sign up for whatever reason: throw an error in this function with the message to be displayed

You can deal with case #2 by doing something like the following in a signup component/page:

```jsx
const { signUp } = useAuth()

const onSubmit = async (data) => {
  const response = await signUp({ ...data })

  if (response.message) {
    toast.error(response.message) // user created, but not logged in
  } else {
    toast.success('Welcome!') // user created and logged in
    navigate(routes.dashboard())
  }
}
```

### forgotPassword.handler()

This handler is invoked if a user is found with the username/email that they submitted on the Forgot Password page, and that user will be passed as an argument. Inside this function is where you'll send the user a link to reset their password—via an email is most common. The link will, by default, look like:

    https://example.com/reset-password?resetToken=${user.resetToken}

If you changed the path to the Reset Password page in your routes you'll need to change it here. If you used another name for the `resetToken` database field, you'll need to change that here as well:

    https://example.com/reset-password?resetKey=${user.resetKey}

### resetPassword.handler()

This handler is invoked after the password has been successfully changed in the database. Returning something truthy (like `return user`) will automatically log the user in after their password is changed. If you'd like to return them to the login page and make them log in manually, `return false` and redirect the user in the Reset Password page.

### Cookie config

These options determine how the cookie that tracks whether the client is authorized is stored in the browser. The default configuration should work for most use cases. If you serve your web and api sides from different domains you'll need to make some changes: set `SameSite` to `None` and then add [CORS configuration](#cors-config).

```jsx
cookie: {
  HttpOnly: true,
  Path: '/',
  SameSite: 'Strict',
  Secure: true,
  // Domain: 'example.com',
}
```

### CORS config

If you're using dbAuth and your api and web sides are deployed to different domains then you'll need to configure CORS for both GraphQL in general and dbAuth. You'll also need to enable a couple of options to be sure and send/accept credentials in XHR requests. For more info, see the complete [CORS doc](cors.md#cors-and-authentication).

### Error Messages

There are several error messages that can be displayed, including:

- Username/email not found
- Incorrect password
- Expired reset password token

We've got some default error messages that sound nice, but may not fit the tone of your site. You can customize these error messages in `api/src/functions/auth.js` in the `errors` prop of each of the `login`, `signup`, `forgotPassword` and `resetPassword` config objects. The generated file contains tons of comments explaining when each particular error message may be shown.

## Environment Variables

### Cookie Domain

By default, the session cookie will not have the `Domain` property set, which a browser will default to be the [current domain only](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#define_where_cookies_are_sent). If your site is spread across multiple domains (for example, your site is at `example.com` but your api-side is deployed to `api.example.com`) you'll need to explicitly set a Domain so that the cookie is accessible to both.

To do this, create an environment variable named `DBAUTH_COOKIE_DOMAIN` set to the root domain of your site, which will allow it to be read by all subdomains as well. For example:

    DBAUTH_COOKIE_DOMAIN=example.com

### Session Secret Key

If you need to change the secret key that's used to encrypt the session cookie, or deploy to a new target (each deploy environment should have its own unique secret key) we've got a CLI tool for creating a new one:

    yarn rw g secret

Note that the secret that's output is _not_ appended to your `.env` file or anything else, it's merely output to the screen. You'll need to put it in the right place after that.

:::caution .env and Version Control

The `.env` file is set to be ignored by git and not committed to version control. There is another file, `.env.defaults`, which is meant to be safe to commit and contain simple ENV vars that your dev team can share. The encryption key for the session cookie is NOT one of these shareable vars!

:::

## WebAuthn

[WebAuthn](https://webauthn.guide/) is a specification written by the W3C and FIDO with participation from Google, Mozilla, Microsoft, and others. It defines a standard way to use public key cryptography instead of a password to authenticate users.

That's a very technical way of saying: users can log in with [TouchID](https://en.wikipedia.org/wiki/Touch_ID), [FaceID](https://en.wikipedia.org/wiki/Face_ID), [Windows Hello](https://support.microsoft.com/en-us/windows/learn-about-windows-hello-and-set-it-up-dae28983-8242-bb2a-d3d1-87c9d265a5f0), [Yubikey](https://www.yubico.com/), and more.

<img width="401" alt="image" src="https://user-images.githubusercontent.com/300/174893269-2cbb1008-ab84-4121-80ee-cfa9250ba1bd.png" />

We'll refer to whatever biometric device that's used as simply a "device" below. The WebAuthn flow includes two "phases":

1. **Registration**: the first time a new device is added for a user (a user can have multiple devices registered)
2. **Authentication**: the device is recognized and can be used to login on subsequent visits

### User Experience

The `LoginPage` generated by Redwood includes two new prompts on the login page, depending on the state of the user and whether they have registered their device yet or not:

**Registration**

The user is prompt to login with username/password:

<img width="417" alt="image" src="https://user-images.githubusercontent.com/300/174903338-84ae504c-2e8c-444c-83aa-2cf60320c21e.png" />

Then asked if they want to enable WebAuthn:

<img width="405" alt="image" src="https://user-images.githubusercontent.com/300/174903419-7a73fa35-c732-48c1-a8f9-6bfa801437e0.png" />

If so, they are shown the browser's prompt to scan:

<img width="362" alt="image" src="https://user-images.githubusercontent.com/300/174903492-deae26db-232e-4712-a81b-4b703be12a4b.png" />

If they skip, they just proceed into the site as usual. If they log out and back in, they will be prompted to enable WebAuthn again.

**Authentication**

When a devices is already registered then it can be used to skip username/password login. The user is immediately shown the prompt to scan when they land on the login page (if the prompt doesn't show, or they mistakenly cancel it, they can click "Open Authenticator" to show the prompt again)

<img width="701" alt="image" src="https://user-images.githubusercontent.com/300/174904236-ccf6eba4-35ce-46e7-ad04-42eee43d3bba.png" />

They can also choose to go to use username/password credentials instead of their registered device.

### How it Works

The back and forth between the web and api sides works like this:

**Registration**

1. If the user selects to enable their device, a request is made to the server for "registration options" which is a JSON object containing details about the server and user (domain, username).
2. The site receives that data and then makes a browser API call that says to start the biometric reader with the received options
3. The user scans their fingerprint/face and the browser API returns an ID representing this device and an associated public key
4. The ID, public key, and user details are sent to the server to be saved to the database. The server responds by placing a cookie on the user's browser with the device ID (a random string of letters and numbers)

A similar process takes place when authenticating:

**Authentication**

1. If the cookie from the previous process is present, the web side knows that the user has a registered device so a request is made to the server to get "authentication options"
2. The server looks up user who's credential ID is in the cookie and gets a list of all of the devices they have registered in the past. This is included along with the domain and username
3. The web side receives the options from the server and a browser API call is made. The browser first checks to see if the list of devices from the server includes the current device. If so, it prompts the user to scan their fingerprint/face
4. The ID, public key, user details and a signature are sent to the server and checked to make sure the signature contains the expected data encrypted with the public key. If so, the regular login cookie is set (the same as if the user had used username/password login)

In both cases actual scanning and matching of devices is handled by the operating system: all we care about is that we are given a credential ID and a public key back from the device.

### Caveats

iOS Safari currently has a limitation where only a single `async` event can occur before asking to prompt the user for a WebAuthn interaction. In React, there are lots of `async` events floating around as you browse a site, which means the chances that the WebAuthn request is the first one is pretty slim. 

This means that if the login page is not the first page you land on, trying to authenticate will raise an error. Redwood catches this error and responds with the following prompt (which we know is not ideal, but better than the default message of "No available authenticator recognized any of the available credentials"):

<img width="397" alt="image" src="https://user-images.githubusercontent.com/300/174905977-6612e0dc-93b3-4572-be54-897a282d64fb.png" />

You could catch this error on your login page and display your own custom error message, of course.

So the workaround is to simply reload the page (guaranteeing that the WebAuthn request will be the first event fired off on the page) then the user is prompted and can login like normal. However, this reload needs to initiated by the user, it can't happen automatically in React (trust us, we already tried).

:::caution Will it be fixed?

Safari (and other browsers based on WebKit on iOS) have had this limitation for quite a while (and it used to be even [more harsh](https://groups.google.com/a/fidoalliance.org/g/fido-dev/c/pIs0DIajWVs/m/xeg0WjFkAQAJ) to the point that WebAuthn was functionally unusable) so it may never be rectified. Our best bet may be to just come up with a more friendly message that makes it clear this isn't the user's problem, but just a current limitation of the browser ecosystem.

:::

### Configuration

WebAuthn support requires a few updates to your codebase:

1. Adding a `UserCredential` model
2. Adding configuration options in `api/src/functions/auth.js`
3. Adding a `client` to the `<AuthProvider>` in `App.js`
4. Adding an interface during the login process that prompts the user to enable their device

:::info
If you setup dbAuth and generated login/signup pages with the `--webAuthn` key then all of these steps have already been done for you! As described in the post-setup instructions you just need to add the required fields to your `User` model, create a `UserCredential` model, and you're ready to go!

If you didn't use the `--webAuthn` flag, but decided you now want WebAuthn, you could run the setup and genrator commands again with the `--force` flag to overwrite your existing files. Any changes you made will be overwritten, but if you do a quick diff in git you should be able to port over most of your changes.
:::

### Schema Updates

You'll need to add two fields to your `User` model, and a new `UserCredential` model to store the devices that are used and associate them with a user:

```javascript title=api/db/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = "native"
}

model User {
  id                  Int @id @default(autoincrement())
  email               String  @unique
  hashedPassword      String
  salt                String
  resetToken          String?
  resetTokenExpiresAt DateTime?
  // highlight-start
  webAuthnChallenge   String? @unique
  credentials         UserCredential[]
  // highlight-end
}

// highlight-start
model UserCredential {
  id         String @id
  userId     Int
  user       User   @relation(fields: [userId], references: [id])
  publicKey  Bytes
  transports String?
  counter    BigInt
}
// highlight-end
```

Run `yarn rw prisma migrate dev` to apply the changes to your database.

### Function Config 

Next we need to let dbAuth know about the new field and model names, as well as how you want WebAuthn to behave:

```javascript title=api/src/functions/auth.js
import { db } from 'src/lib/db'
import { DbAuthHandler } from '@redwoodjs/api'

export const handler = async (event, context) => {
  const forgotPasswordOptions = {
    handler: (user) => {
      return user
    },

    expires: 60 * 60 * 24,

    errors: {
      usernameNotFound: 'Username not found',
      usernameRequired: 'Username is required',
    },
  }

  const loginOptions = {
    handler: (user) => {
      return user
    },

    errors: {
      usernameOrPasswordMissing: 'Both username and password are required',
      usernameNotFound: 'Username ${username} not found',
      incorrectPassword: 'Incorrect password for ${username}',
    },

    expires: 60 * 60 * 24 * 365 * 10,
  }

  const resetPasswordOptions = {
    handler: (user) => {
      return user
    },

    allowReusedPassword: true,

    errors: {
      resetTokenExpired: 'resetToken is expired',
      resetTokenInvalid: 'resetToken is invalid',
      resetTokenRequired: 'resetToken is required',
      reusedPassword: 'Must choose a new password',
    },
  }

  const signupOptions = {
    handler: ({ username, hashedPassword, salt, userAttributes }) => {
      return db.user.create({
        data: {
          email: username,
          hashedPassword: hashedPassword,
          salt: salt,
          // name: userAttributes.name
        },
      })
    },

    errors: {
      fieldMissing: '${field} is required',
      usernameTaken: 'Username `${username}` already in use',
    },
  }

  const authHandler = new DbAuthHandler(event, context, {
    db: db,
    authModelAccessor: 'user',
    // highlight-start
    credentialModelAccessor: 'userCredential',
    // highlight-end
    authFields: {
      id: 'id',
      username: 'email',
      hashedPassword: 'hashedPassword',
      salt: 'salt',
      resetToken: 'resetToken',
      resetTokenExpiresAt: 'resetTokenExpiresAt',
      challenge: 'webAuthnChallenge',
    },

    cookie: {
      HttpOnly: true,
      Path: '/',
      SameSite: 'Strict',
      Secure: process.env.NODE_ENV !== 'development' ? true : false,
    },

    forgotPassword: forgotPasswordOptions,
    login: loginOptions,
    resetPassword: resetPasswordOptions,
    signup: signupOptions,

    // highlight-start
    webAuthn: {
      enabled: true,
      name: 'Webauthn Test',
      domain:
        process.env.NODE_ENV === 'development' ? 'localhost' : 'server.com',
      origin:
        process.env.NODE_ENV === 'development'
          ? 'http://localhost:8910'
          : 'https://server.com',
      type: 'platform',
      timeout: 60000,
      credentialFields: {
        id: 'id',
        userId: 'userId',
        publicKey: 'publicKey',
        transports: 'transports',
        counter: 'counter',
      },
    },
    // highlight-end
  })

  return await authHandler.invoke()
}
```

* `credentialModelAccessor` specifies the name of the model that's going to hold the credentials.
* `webAuthn.enabled` is a boolean, denoting whether the server should respond to webAuthn requests
* `webAuthn.name` is the name of the app that will show in some browser's prompts to use the device
* `webAuthn.domain` is the name of domain making the request (this is just the domain part of the URL, ex: `app.server.com`, or in development mode `localhost`)
* `webAuthn.origin` is the domain plus the protocol and port, that the request is coming from, ex: https://app.server.com In development mode, this would be `http://localhost:8910`
* `webAuthn.type`: the type of device that's allowed to be used (see next section below)
* `webAuthn.timeout`: how long to wait for a device to be used in milliseconds (defaults to 60 seconds)
* `webAuthn.credentialFields`: lists the expected field names in the database table that contains user credentials to what they're actually called in your `UserCredential` model. This includes 5 fields total: `id`, `userId`, `publicKey`, `transports`, `counter`

### WebAuthn `type` Option

The config option `webAuthn.type` can be set to `any`, `platform` or `cross-platform`:

* `any` means to allow either platform or cross-platform devices
* `platform` means to only allow embedded devices (TouchID, FaceID, Windows Hello) to be used
* `cross-platform` means to allow only third party devices (like a Yubikey USB fingerprint reader)

In some browsers this can lead to a pretty drastic UX difference. For example, here is the interface in Chrome on macOS with the included TouchID sensor on a Macbook Pro:

#### **any**

<img width="446" alt="image" src="https://user-images.githubusercontent.com/300/174896660-c2960921-046c-49ad-8ff0-38c019569371.png" />

If you pick "Add a new Android Phone" you're presented with a QR code:

<img width="445" alt="image" src="https://user-images.githubusercontent.com/300/174896265-bb513c82-56a7-4bbc-892e-97aa8a57f525.png" />

If you pick "USB Security Key" you're given the chance to scan your fingerprint in a 3rd party USB device:

<img width="445" alt="image" src="https://user-images.githubusercontent.com/300/174896250-a0c447e7-c238-47bb-ab14-86b63385178e.png" />

And finally if you pick "This device" you're presented with the standard interface you'd get if used `platform` as your type:

<img width="251" alt="image" src="https://user-images.githubusercontent.com/300/174895503-de913272-f219-4d28-9e86-ac6190785dfd.png" />

You'll have to decide if this UX tradeoff is worth it for your customers, as it can be pretty confusing when first presented with all of these options when someone is just used to using TouchID or FaceID.

#### **platform**

The `platform` option provides the simplest UI and one that users with a TouchID or FaceID will be immediately familiar with:

<img width="251" alt="image" src="https://user-images.githubusercontent.com/300/174895503-de913272-f219-4d28-9e86-ac6190785dfd.png" />

Note that you can also fallback to use your user account password (on the computer itself) in addition to TouchID:

<img width="251" alt="image" src="https://user-images.githubusercontent.com/300/174895743-24042578-4461-4c3b-b51c-8abc0325f065.png" />

Both the password and TouchID scan will count as the same device, so users can alternate between them if they want.

#### **cross-platform**

This interface is the same as `any`, but without the option to pick "This device":

<img width="445" src="https://user-images.githubusercontent.com/300/174896275-066b163b-8203-4287-9e3f-ba545552dd22.png" />

So while the `any` option is the most flexible, it's also the most confusing to users. If you do plan on allowing any device, you may want to do a user-agent check and try to explain to users what the different options actually mean.

The api-side is now ready to go.

### App.js Updates

If you generated your login/signup pages with `yarn rw g dbAuth --webAuthn` then all of these changes are in place and you can start using WebAuthn right away! Otherwise, read on.

First you'll need to import the `WebAuthnClient` and give it to the `<AuthProvider>` component:

```jsx title="web/src/App.js"
import { AuthProvider } from '@redwoodjs/auth'
// highlight-start
import WebAuthnClient from '@redwoodjs/auth/webAuthn'
// highlight-end
import { FatalErrorBoundary, RedwoodProvider } from '@redwoodjs/web'
import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'

import './scaffold.css'
import './index.css'

const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
      // highlight-start
      <AuthProvider type="dbAuth" client={WebAuthnClient}>
      // highlight-end
        <RedwoodApolloProvider>
          <Routes />
        </RedwoodApolloProvider>
      </AuthProvider>
    </RedwoodProvider>
  </FatalErrorBoundary>
)

export default App
```

Now you're ready to access the functionality added by the WebAuthn client. The easiest way to do this would be to generate a new `LoginPage` with `yarn rw g dbAuth --webAuthn`, even if it's in a brand new, throwaway app, and copy the pieces you need (or just replace your existing login page with it).

The gist of building a login flow is that you now need to stop after username/password authentication and, if the browser supports WebAuthn, give the user the chance to register their device. If they come to the login page and already have the `webAuthn` cookie then you can show the prompt to authenticate, skipping the username/password form completely. This is all handled in the LoginPage template that Redwood generates for you.

### WebAuthn Client API

The `client` that we gave to the `AuthProvider` can be destructured from `useAuth()`:

```javascript
const { isAuthenticated, client, logIn } = useAuth()
```

`client` gives you access to four functions for working with WebAuthn:

* `client.isSupported()`: return sa Promise which returns a boolean for whether or not WebAuthn is supported in the browser
* `client.isEnabled()`: returns a boolean for whether the user currently has a `webAuthn` cookie, which means this device has been registered already and can be used for login
* `client.register()`: returns a Promise which gets options from the server, presents the prompt to scan your fingerprint/face, and then sends the result up to the server. It will either return successfully or throw an error. This is used when the user has not registered this device yet (`client.isEnabled()` returns `false`)
* `client.authenticate()`: returns a Promise which gets options from the server, presents the prompt to scan the user's fingerprint/face, and then sends the result up to the server. It will either return successfully or throw an error. This should be used when the user has already registered this device (`client.isEnabled()` returns `true`)


