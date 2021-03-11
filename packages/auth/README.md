# Authentication

## Contributing

Adding a new auth provider is easier than you may expect. The main objective is to map the methods of an instance of your target auth library to a shape that Redwood understands.

Here is the implementation for Auth0:

```ts
// authClients/auth0.ts
const mapAuthClientAuth0 = (client: Auth0): AuthClientAuth0 => {
  return {
    type: 'auth0',
    client,
    restoreAuthState: async () => {
      if (window.location.search.includes('code=')) {
        const { appState } = await client.handleRedirectCallback()
        window.history.replaceState(
          {},
          document.title,
          appState && appState.targetUrl
            ? appState.targetUrl
            : window.location.pathname
        )
      }
    },
    logIn: async (options?) => client.loginWithRedirect(options),
    logOut: (options?) => client.logout(options),
    signUp: (options?) => client.signup(options),
    getToken: async () => client.getTokenSilently(),
    currentUser: async () => {
      const user = await client.getUser()
      return user || null
    },
    getUserMetadata: async () => {
      const user = await client.getUser()
      return user || null
    },
  }
}
```

You'll need to import the type definition for you client and add it to the supported auth types:

## Sign Up

Note: Not all AuthProviders support a separate `signUp` authentication flow -- such as for passwordless authentication or authentication with social providers (GitHub, Google, etc). In these cases, `signUp` will perform the same flow as `login()`.

### Auth0 Sign Up

If you want to use the useAuth hook `Sign Up` with Auth0 to default the UI to the sign up "tab", you need to be using the ["New Universal Login Experience"](https://auth0.com/docs/universal-login/new-experience). The "Classic Universal Experience" does not support the `screen_hint` to set the tab.

```ts
// authClients/index.ts
export type SupportedAuthClients =
  | Auth0
  | AzureActiveDirectory
  | GoTrue
  | NetlifyIdentity
  | MagicLink
  | Firebase
  | Supabase
  | Ethereum
  | Nhost
  | Custom
```
