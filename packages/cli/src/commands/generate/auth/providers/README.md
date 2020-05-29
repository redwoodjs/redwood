# Auth Providers

Adding a new auth provider generator should be as easy as adding a new file here and making sure it contains
the required exports.

We'll use the Netlify Identity config as an example and discuss the requirements below:

```javascript
export const config = {
  imports: [{ import: 'netlifyIdentity', from: 'netlify-identity-widget' }],
  init: 'netlifyIdentity.init()',
  authProvider: {
    client: 'netlifyIdentity',
    type: 'netlify',
  },
}

export const packages = ['netlify-identity-widget']

export const notes = [
  'You will need to enable Identity on your Netlify site and configure the API endpoint.',
  'See: https://github.com/netlify/netlify-identity-widget#localhost',
]
```

## `config`

The `config` object contains everything that needs to be inserted into `web/src/index.js` to setup the auth provider
and make it available to the routing engine.

### `imports`

An array of objects that lists any imports that need to be added to the top of the file.

`{ import: 'netlifyIdentity', from: 'netlify-identity-widget' }` becomes `import 'netlifyIdentity' from 'netlify-identity-widget'`

### `init`

Any initialization code that needs to go after the `import` statements.

### `authProvider`

An object containing exactly two keys, `client` and `type` which will be sent as props to `<AuthProvider>`.

## `packages`

An array of strings of package names that needed to be added to the web workspace's `package.json`.

## `notes`

An array of strings that will be output after the generator has run, informing the user about any further required
setup (like setting ENV vars). Each string in the array will be output on its own line.
