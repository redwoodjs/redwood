// the lines that need to be added to App.{js,tsx}
export const config = {
  imports: [`import { ClerkProvider, withClerk } from '@clerk/clerk-react'`],
  init: `
// Wrap <ClerkAuthProvider> around the Redwood <AuthProvider>
//
// You can set user roles in a "roles" array on the public metadata in Clerk.
//
// Also, you need to add two env variables: CLERK_FRONTEND_API_URL for web and
// CLERK_API_KEY for api, with the frontend api host and api key, respectively,
// both from your Clerk.dev dashboard.
//
// Lastly, be sure to add the key "CLERK_FRONTEND_API_URL" in your app's redwood.toml
// [web] config "includeEnvironmentVariables" setting.

const ClerkAuthConsumer = withClerk(({ children, clerk }) => {
  return React.cloneElement(children as React.ReactElement<any>, { client: clerk })
})

const ClerkAuthProvider = ({ children }) => {
  const frontendApi = process.env.CLERK_FRONTEND_API_URL
  if (!frontendApi) {
    throw new Error('Need to define env variable CLERK_FRONTEND_API_URL')
  }

  return (
    <ClerkProvider frontendApi={frontendApi}>
      <ClerkAuthConsumer>{children}</ClerkAuthConsumer>
    </ClerkProvider>
  )
}`,
  authProvider: {
    type: 'clerk',
  },
}

// required packages to install
export const webPackages = ['@clerk/clerk-react']
export const apiPackages = ['@clerk/clerk-sdk-node']

// any notes to print out when the job is done
export const notes = [
  'You will need to add two environment variables with your Clerk URL and API key.',
  'Check out web/src/App.{js,tsx} for the variables you need to add.',
  'See also: https://redwoodjs.com/docs/authentication#clerk',
]
