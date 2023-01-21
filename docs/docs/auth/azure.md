---
sidebar_label: Azure
---

# Azure Active Directory Authentication

To get started, run the setup command:

```bash
yarn rw setup auth azure-active-directory
```

This installs all the packages, writes all the files, and makes all the code
modifications you need. For a detailed explanation of all the api- and web-side
changes that aren't exclusive to Azure, see the top-level
[Authentication](../authentication.md) doc. For now, let's focus on Azure's
side of things.

## Setup

To get your application credentials, create an
[App Registration](https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-app-registration)
using your Azure Active Directory tenant and make sure you configure an
[MSAL.js 2.0 with auth code flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-app-registration#redirect-uri-msaljs-20-with-auth-code-flow)
registration. Take a note of your generated _Application ID_ (client), and the
_Directory ID_ (tenant). _Application ID_ should be stored in an environment
variable called `AZURE_ACTIVE_DIRECTORY_CLIENT_ID`

[Learn more about authorization code flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/reference-third-party-cookies-spas).

## Redirect URIs

Enter allowed redirect urls for the integrations, e.g.
`http://localhost:8910` and `http://localhost:8910/login`. These urls should be
used for the `AZURE_ACTIVE_DIRECTORY_REDIRECT_URI` and
`AZURE_ACTIVE_DIRECTORY_LOGOUT_REDIRECT_URI` environment variables

## Authority

The Authority is a URL that indicates a directory that MSAL (Microsoft
Authentication Library) can request tokens from which you can read about
[here](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-client-application-configuration#authority).
However, you most likely want to have
`https://login.microsoftonline.com/<tenant>` as Authority URL, where `<tenant>`
is the Azure Active Directory tenant id. This value will be used for the
`AZURE_ACTIVE_DIRECTORY_AUTHORITY` environment variable.

## Environment variables

Copy all your environment variables into your project's `.env` file:

```bash title=".env"
AZURE_ACTIVE_DIRECTORY_CLIENT_ID="..."
AZURE_ACTIVE_DIRECTORY_REDIRECT_URI="..."
AZURE_ACTIVE_DIRECTORY_LOGOUT_REDIRECT_URI="..."
AZURE_ACTIVE_DIRECTORY_AUTHORITY="..."
```

Here are some example values
```bash title=".env"
AZURE_ACTIVE_DIRECTORY_CLIENT_ID=831080ad-742f-4507-847d-c4b05ff6b825
# https://login.microsoftonline.com/<tenant> as Authority URL, where <tenant> is the Azure Active Directory tenant id
AZURE_ACTIVE_DIRECTORY_AUTHORITY=https://login.microsoftonline.com/e1337ae2-8308-440d-9745-292bd4d1de17
AZURE_ACTIVE_DIRECTORY_REDIRECT_URI=http://localhost:8910/
AZURE_ACTIVE_DIRECTORY_LOGOUT_REDIRECT_URI=http://localhost:8910/login
```

All environment variables also need to be included in the list of env vars that
should be available to the web side.

```toml title="redwood.toml"
[web]
  # ...
  includeEnvironmentVariables = [
    "AZURE_ACTIVE_DIRECTORY_CLIENT_ID",
    "AZURE_ACTIVE_DIRECTORY_REDIRECT_URI",
    "AZURE_ACTIVE_DIRECTORY_LOGOUT_REDIRECT_URI",
    "AZURE_ACTIVE_DIRECTORY_AUTHORITY",
  ]
```

## Example code

Now let's make sure everything works: if this is a brand new project, generate
a home page. There we'll try to sign up by destructuring `signUp` from the
`useAuth` hook (import that from `'src/auth'`). We'll also destructure and
display `isAuthenticated` to see if it worked:

```tsx title="web/src/pages/HomePage.tsx"
import { useAuth } from 'src/auth'

const HomePage = () => {
  const { isAuthenticated, signUp } = useAuth()

  return (
    <>
      {/* MetaTags, h1, paragraphs, etc. */}

      <p>{JSON.stringify({ isAuthenticated })}</p>
      <button onClick={() => signUp()}>
        Sign Up
      </button>
    </>
  )
}
```

## Integration

### Roles

To setup your App Registration with custom roles and have them exposed via the
`roles` claim, follow
[this documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/howto-add-app-roles-in-azure-ad-apps).

### Login Options

Options in method `logIn(options?)` is of type [RedirectRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#redirectrequest) and is a good place to pass in optional [scopes](https://docs.microsoft.com/en-us/graph/permissions-reference#user-permissions) to be authorized. By default, MSAL sets `scopes` to [/.default](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#the-default-scope) which is built in for every application that refers to the static list of permissions configured on the application registration. Furthermore, MSAL will add `openid` and `profile` to all requests. In the example below we explicit include `User.Read.All` in the login scope.

```jsx
await logIn({
  scopes: ['User.Read.All'], // becomes ['openid', 'profile', 'User.Read.All']
})
```

See [loginRedirect](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_browser.publicclientapplication.html#loginredirect), [PublicClientApplication](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_browser.publicclientapplication.html) class and [Scopes Behavior](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-core/docs/scopes.md#scopes-behavior) for more documentation.

### getToken Options

Options in method `getToken(options?)` is of type [RedirectRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#redirectrequest). By default, `getToken` will be called with scope `['openid', 'profile']`. As Azure Active Directory apply [incremental consent](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md#dynamic-scopes-and-incremental-consent), we can extend the permissions from the login example by including another scope, for example `Mail.Read`.

```jsx
await getToken({
  scopes: ['Mail.Read'], // becomes ['openid', 'profile', 'User.Read.All', 'Mail.Read']
})
```

See [acquireTokenSilent](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_browser.publicclientapplication.html#acquiretokensilent), [Resources and Scopes](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md#resources-and-scopes) or [full class documentation](https://pub.dev/documentation/msal_js/latest/msal_js/PublicClientApplication-class.html#constructors) for more documentation.

## Azure AD B2C specific configuration

Using Azure AD B2C with [hosted user flows](https://docs.microsoft.com/en-us/azure/active-directory-b2c/add-sign-up-and-sign-in-policy?pivots=b2c-user-flow) requires 2 extra settings

#### Update the .env file:

- [MS Documentation about B2C JWT Issuer](https://docs.microsoft.com/en-us/azure/active-directory-b2c/tokens-overview)
- [MS Documentation about MSAL, Azure B2C (authority|known authorities) parameters](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/working-with-b2c.md)

```bash title="./.env"
AZURE_ACTIVE_DIRECTORY_AUTHORITY=https://{your-microsoft-tenant-name}.b2clogin.com/{{your-microsoft-tenant-name}}.onmicrosoft.com/{{your-microsoft-user-flow-id}}
AZURE_ACTIVE_DIRECTORY_JWT_ISSUER=https://{{your-microsoft-tenant-name}}.b2clogin.com/{{your-microsoft-tenant-id}}/v2.0/
AZURE_ACTIVE_DIRECTORY_KNOWN_AUTHORITY=https://{{your-microsoft-tenant-name}}.b2clogin.com
```

Here are some example values
```bash title="./env.example"
AZURE_ACTIVE_DIRECTORY_AUTHORITY=https://rwauthtestb2c.b2clogin.com/rwauthtestb2c.onmicrosoft.com/B2C_1_signupsignin1
AZURE_ACTIVE_DIRECTORY_JWT_ISSUER=https://rwauthtestb2c.b2clogin.com/775527ef-8a37-4307-8b3d-cc311f58d922/v2.0/
AZURE_ACTIVE_DIRECTORY_KNOWN_AUTHORITY=https://rwauthtestb2c.b2clogin.com
```

Don't forget to also add `AZURE_ACTIVE_DIRECTORY_KNOWN_AUTHORITY` to the
`includeEnvironmentVariables` list in `redwood.toml`.
(`AZURE_ACTIVE_DIRECTORY_JWT_ISSUER` is only used on the API side and should
*not* be added to `redwood.toml`)

#### Update const activeDirectoryClient instance

This lets the MSAL web side client know about our new B2C allowed authority
that we defined in the .env file

```jsx title="./web/auth.{js,ts}
const azureActiveDirectoryClient = new PublicClientApplication({
  auth: {
    clientId: process.env.AZURE_ACTIVE_DIRECTORY_CLIENT_ID,
    authority: process.env.AZURE_ACTIVE_DIRECTORY_AUTHORITY,
    redirectUri: process.env.AZURE_ACTIVE_DIRECTORY_REDIRECT_URI,
    postLogoutRedirectUri:
      process.env.AZURE_ACTIVE_DIRECTORY_LOGOUT_REDIRECT_URI,
    // highlight-next-line
    knownAuthorities: [process.env.AZURE_ACTIVE_DIRECTORY_KNOWN_AUTHORITY]
  },
})
```

Now you can call the `logIn` and `logOut` functions from `useAuth()`, and
everything should just work®
