---
sidebar_label: Netlify
---

# Netlify Identity Authentication

## Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth netlify
```

_If you prefer to manually install the package and add code_, run the following command and then add the required code provided in the next section.

```bash
cd web
yarn add @redwoodjs/auth netlify-identity-widget
```

## Setup

You will need to enable Identity on your Netlify site.

```jsx title="web/src/App.js"
import { AuthProvider } from '@redwoodjs/auth'
import netlifyIdentity from 'netlify-identity-widget'
import { isBrowser } from '@redwoodjs/prerender/browserUtils'
import { FatalErrorBoundary } from '@redwoodjs/web'
import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'

import './index.css'

isBrowser && netlifyIdentity.init()

const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <AuthProvider client={netlifyIdentity} type="netlify">
      <RedwoodApolloProvider>
        <Routes />
      </RedwoodApolloProvider>
    </AuthProvider>
  </FatalErrorBoundary>
)

export default App
```

## Netlify Identity Auth Provider Specific Setup

See the Netlify Identity information within this doc's [Auth Provider Specific Integration](#auth-provider-specific-integration) section.


## Integration

[Netlify Identity](https://docs.netlify.com/visitor-access/identity) offers [Role-based access control (RBAC)](https://docs.netlify.com/visitor-access/identity/manage-existing-users/#user-account-metadata).

### Role-based access control (RBAC)

Role-based access control (RBAC) refers to the idea of assigning permissions to users based on their role within an organization. It provides fine-grained control and offers a simple, manageable approach to access management that is less prone to error than assigning permissions to users individually.

Essentially, a role is a collection of permissions that you can apply to users. A role might be "admin", "editor" or "publisher". This differs from permissions an example of which might be "publish:blog".

### App Metadata

Netlify Identity stores information (such as, support plan subscriptions, security roles, or access control groups) in `app_metadata`. Data stored in `app_metadata` cannot be edited by users.

Create and manage roles for your application in Netlify's "Identity" management views. You can then assign these roles to users.

### Add Application `hasRole` Support

If you intend to support, RBAC then in your `api/src/lib/auth.js` you need to extract `roles` using the `parseJWT` utility and set these roles on `currentUser`.

Netlify will store the user's roles on the `app_metadata` claim and the `parseJWT` function provides an option to extract the roles so they can be assigned to the `currentUser`.

For example:

```jsx title="api/src/lib/auth.js"
export const getCurrentUser = async (decoded) => {
  return context.currentUser || { ...decoded, roles: parseJWT({ decoded }).roles }
}
```

Now your `currentUser.roles` info will be available to both `requireAuth()` on the api side and `hasRole()` on the web side.
