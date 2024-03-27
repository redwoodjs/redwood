---
sidebar_label: Nhost
---

# Nhost Authentication

## Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth nhost
```

## Setup

Update your .env file with the following setting which can be found on your Nhost project's dashboard.

- `NHOST_BACKEND_URL` with the unique Nhost Backend URL that can be found in the app's dashboard.
- `NHOST_JWT_SECRET` with the JWT Key secret that you have set in your project's Settings > Hasura "JWT Key" section.

## Usage

Nhost supports the following methods:

- email/password
- passwordless with email
- passwordless with SMS
- OAuth Providers (via GitHub, Google, Facebook, Spotify, Discord, Twitch, Apple, Twitter, Microsoft and Linkedin).

Depending on the credentials provided:

- A user can sign in either via email or a supported OAuth provider.
- A user can sign up via email and password. For OAuth simply sign in and the user account will be created if it does not exist.
- Note: You must enable and configure the OAuth provider appropriately. To enable and configure a provider, please navigate to Users -> Login settings, from your app's dashboard.

For the docs on Authentication, see: [https://docs.nhost.io/platform/authentication](https://docs.nhost.io/platform/authentication)

If you are also **using Nhost as your GraphQL API server**, you will need to pass `skipFetchCurrentUser` as a prop to `AuthProvider` , as follows:

```jsx
<AuthProvider client={nhost} type="nhost" skipFetchCurrentUser>
```

This avoids having an additional request to fetch the current user which is meant to work with Apollo Server and Prisma.

Important: The `skipFetchCurrentUser` attribute is **only** needed if you are **not** using the standard RedwoodJS api side GraphQL Server.
