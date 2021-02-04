// the lines that need to be added to index.js
export const config = {
  imports: [`import { createClient } from 'nhost-js-sdk'`],
  init: `const nhostClient = createClient({
    base_url: process.env.NHOST_BACKEND_URL,
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
  'You will need to add your Nhost backend URL (NHOST_BACKEND_URL), public API KEY, and JWT SECRET (NHOST_KEY, and NHOST_JWT_SECRET) to your .env file.',
  'See: https://docs.nhost.io',
]
