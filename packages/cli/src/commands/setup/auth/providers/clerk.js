// the lines that need to be added to App.{js,tsx}
export const config = {
  imports: [
    `import { ClerkProvider, ClerkLoaded, useClerk } from '@clerk/clerk-react'`,
  ],
  init: `
// You can set user roles in a "roles" array on the public metadata in Clerk.
// Also, you need to add two env variables: CLERK_FRONTEND_API_URL for web and
// CLERK_API_KEY for api, with the frontend api host and api key, respectively,
// both from your Clerk.dev dashboard.
let clerk
const ClerkAuthConsumer = ({ children }) => {
  clerk = useClerk()
  return React.cloneElement(children, { client: clerk })
}

const ClerkAuthProvider = ({ children }) => {
  const frontendApi = process.env.CLERK_FRONTEND_API_URL
  if (!frontendApi) {
    throw new Error('Need to define env variable CLERK_FRONTEND_API_URL')
  }

  return (
    <ClerkProvider frontendApi={frontendApi}>
      <ClerkLoaded>
        <ClerkAuthConsumer>{children}</ClerkAuthConsumer>
      </ClerkLoaded>
    </ClerkProvider>
  )
}`,
  authProvider: {
    client: 'clerk',
    type: 'clerk',
    render: ['ClerkAuthProvider'],
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
