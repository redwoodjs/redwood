// the lines that need to be added to App.{js,tsx}
export const config = {
  imports: [
    `import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-react'`,
    `import { navigate } from '@redwoodjs/router'`,
  ],
  init: `
// Wrap Redwood's <AuthProvider> with the <ClerkAuthProvider>.
//
// You can set user roles in a "roles" array on the user's public_metadata in Clerk.
//
// Also, you need to add three env variables: CLERK_FRONTEND_API_URL for web and
// CLERK_API_KEY plus CLERK_JWT_KEY for api. All three can be found under "API Keys"
// on your Clerk.dev dashboard.
//
// Lastly, be sure to add the key "CLERK_FRONTEND_API_URL" in your app's redwood.toml
// [web] config "includeEnvironmentVariables" setting.

const ClerkAuthProvider = ({ children }) => {
  const frontendApi = process.env.CLERK_FRONTEND_API_URL
  if (!frontendApi) {
    throw new Error('Need to define env variable CLERK_FRONTEND_API_URL')
  }

  return (
    <ClerkProvider frontendApi={frontendApi} navigate={(to) => navigate(to)}>
      <ClerkLoaded>
        {children}
      </ClerkLoaded>
    </ClerkProvider>
  )
}`,
  authProvider: {
    render: 'ClerkAuthProvider',
    type: 'clerk',
  },
}

// required packages to install
export const webPackages = ['@clerk/clerk-react']
export const apiPackages = ['@clerk/clerk-sdk-node']

// any notes to print out when the job is done
export const notes = [
  'You will need to add three environment variables with your Clerk URL, API key and JWT key.',
  'Check out web/src/App.{js,tsx} for the variables you need to add.',
  'See also: https://redwoodjs.com/docs/authentication#clerk',
]
