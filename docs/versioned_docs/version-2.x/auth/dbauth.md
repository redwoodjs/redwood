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
```
yarn rw setup auth dbAuth
```
Read the post-install instructions carefully as they contain instructions for adding database fields for the hashed password and salt, as well as how to configure the auth serverless function based on the name of the table that stores your user data. Here they are, but could change in future releases:

> You will need to add a couple of fields to your User table in order to store a hashed password and salt:
> ```
> model User {
>   id             Int @id @default(autoincrement())
>   email          String  @unique
>   hashedPassword      String    // <─┐
>   salt                String    // <─┼─ add these lines
>   resetToken          String?   // <─┤
>   resetTokenExpiresAt DateTime? // <─┘
> }
> ```
> If you already have existing user records you will need to provide a default value or Prisma complains, so change those to:
> ```
>   hashedPassword String @default("")
>   salt           String @default("")
> ```
> You'll need to let Redwood know what field you're using for your users' `id` and `username` fields In this case we're using `id` and `email`, so update those in the `authFields` config in `/api/src/functions/auth.js` (this is also the place to tell Redwood if you used a different name for the `hashedPassword` or `salt` fields):
> ```
> authFields: {
>   id: 'id',
>   username: 'email',
>   hashedPassword: 'hashedPassword',
>   salt: 'salt',
>   resetToken: 'resetToken',
>   resetTokenExpiresAt: 'resetTokenExpiresAt',
> },
> ```
> To get the actual user that's logged in, take a look at `getCurrentUser()` in `/api/src/lib/auth.js`. We default it to something simple, but you may use different names for your model or unique ID fields, in which case you need to update those calls (instructions are in the comment above the code).
>
> Finally, we created a `SESSION_SECRET` environment variable for you in `.env`. This value should NOT be checked into version control and should be unique for each environment you deploy to. If you ever need to log everyone out of your app at once change this secret to a new value. To create a new secret, run:
> ```
> yarn rw g secret
> ```
> Need simple Login, Signup and Forgot Password pages? Of course we have a generator for those:
> ```
> yarn rw generate dbAuth
> ```

Note that if you change the fields named `hashedPassword` and `salt`, and you have some verbose logging in your app, you'll want to scrub those fields from appearing in your logs. See the [Redaction](logger.md#redaction) docs for info.

## Scaffolding Login/Signup/Forgot Password Pages

If you don't want to create your own login, signup and forgot password pages from scratch we've got a generator for that:
```
yarn rw g dbAuth
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
```
https://example.com/reset-password?resetToken=${user.resetToken}
```
If you changed the path to the Reset Password page in your routes you'll need to change it here. If you used another name for the `resetToken` database field, you'll need to change that here as well:
```
https://example.com/reset-password?resetKey=${user.resetKey}
```
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
```
DBAUTH_COOKIE_DOMAIN=example.com
```
### Session Secret Key

If you need to change the secret key that's used to encrypt the session cookie, or deploy to a new target (each deploy environment should have its own unique secret key) we've got a CLI tool for creating a new one:
```
yarn rw g secret
```
Note that the secret that's output is _not_ appended to your `.env` file or anything else, it's merely output to the screen. You'll need to put it in the right place after that.

> The `.env` file is set to be ignored by git and not committed to version control. There is another file, `.env.defaults`, which is meant to be safe to commit and contain simple ENV vars that your dev team can share. The encryption key for the session cookie is NOT one of these shareable vars!
