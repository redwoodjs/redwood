---
sidebar_label: Supabase
---

# Supabase Authentication

## Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth supabase
```

## Setup

Update your .env file with the following settings supplied when you created your new Supabase project:

- `SUPABASE_URL` with the unique Supabase URL for your project
- `SUPABASE_KEY` with the unique Supabase Key that identifies which API KEY to use
- `SUPABASE_JWT_SECRET` with the secret used to sign and verify the JSON Web Token (JWT)

You can find these values in your project's dashboard under Settings -> API.

For full Supabase documentation, see: [https://supabase.io/docs](https://supabase.io/docs)

## Usage

Supabase supports several sign in methods:

- email/password
- passwordless via emailed magiclink
- authenticate via phone with SMS based OTP (One-Time Password) tokens. See: [SMS OTP with Twilio](https://supabase.io/docs/guides/auth/auth-twilio)
- Sign in with redirect. You can control where the user is redirected to after they are logged in via a `redirectTo` option.
- Sign in with a valid refresh token that was returned on login.
- Sign in using third-party providers/OAuth via
  - [Apple](https://supabase.io/docs/guides/auth/auth-apple)
  - Azure Active Directory
  - [Bitbucket](https://supabase.io/docs/guides/auth/auth-bitbucket)
  - [Discord](https://supabase.io/docs/guides/auth/auth-discord)
  - [Facebook](https://supabase.io/docs/guides/auth/auth-facebook)
  - [GitHub](https://supabase.io/docs/guides/auth/auth-github)
  - [GitLab](https://supabase.io/docs/guides/auth/auth-gitlab)
  - [Google](https://supabase.io/docs/guides/auth/auth-google)
  - [Twitch](https://supabase.io/docs/guides/auth/auth-twitch)
  - [Twitter](https://supabase.io/docs/guides/auth/auth-twitter)
- Sign in with a [valid refresh token](https://supabase.io/docs/reference/javascript/auth-signin#sign-in-using-a-refresh-token-eg-in-react-native) that was returned on login. Used e.g. in React Native.
- Sign in with scopes. If you need additional data from an OAuth provider, you can include a space-separated list of `scopes` in your request options to get back an OAuth `provider_token`.

Depending on the credentials provided:

- A user can sign up either via email or sign in with supported OAuth provider: `'apple' | 'azure' | 'bitbucket' | 'discord' | 'facebook' | 'github' | 'gitlab' | 'google' | 'twitch' | 'twitter'`
- If you sign in with a valid refreshToken, the current user will be updated
- If you provide email without a password, the user will be sent a magic link.
- The magic link's destination URL is determined by the SITE_URL config variable. To change this, you can go to Authentication -> Settings on `app.supabase.io` for your project.
- Specifying an OAuth provider will open the browser to the relevant login page
- Note: You must enable and configure the OAuth provider appropriately. To configure these providers, you can go to Authentication -> Settings on `app.supabase.io` for your project.
- Note: To authenticate using SMS based OTP (One-Time Password) you will need a [Twilio](https://www.twilio.com/try-twilio) account

For Supabase Authentication documentation, see: [https://supabase.io/docs/guides/auth](https://supabase.io/docs/guides/auth)
