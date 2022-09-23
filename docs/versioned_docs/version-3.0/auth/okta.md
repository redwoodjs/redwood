# Okta

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth okta
```

Update your .env file with the following setting which can be found on your Okta project's dashboard.

- `OKTA_ISSUER` The URL for your Okta organization or an Okta authentication server.
- `OKTA_CLIENT_ID` Client Id pre-registered with Okta for the OIDC authentication flow.
- `OKTA_REDIRECT_URI` The URL that is redirected to when using token.getWithRedirect. This must be listed in your Okta application's Login redirect URIs.
- `OKTA_AUDIENCE` The audience of the Okta jwt token
- `OKTA_DOMAIN` The domain for your Okta authentication server.
