// the lines that need to be added to App.{js,tsx}
export const config = {
  imports: [`import { createClient } from 'nhost-js-sdk'`],
  init: `const nhostClient = createClient({
  baseURL: process.env.NHOST_BACKEND_URL,
  autoLogin: false,
});
`,
  authProvider: {
    client: 'nhostClient',
    type: 'nhost',
  },
}

// required packages to install
export const webPackages = ['nhost-js-sdk']
export const apiPackages = []

// any notes to print out when the job is done
export const notes = [
  "You will need to add your project's backend URL (NHOST_BACKEND_URL) and JWT Key Secret (NHOST_JWT_SECRET) to your .env file.",
]
