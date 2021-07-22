// the lines that need to be added to App.{js,tsx}
export const config = {
  imports: [`import GoTrue from 'gotrue-js'`],
  init: `const goTrueClient = new GoTrue({
  APIUrl: 'https://MYAPP.netlify.app/.netlify/identity',
  setCookie: true,
})`,
  authProvider: {
    client: 'goTrueClient',
    type: 'goTrue',
  },
}

// required packages to install
export const webPackages = ['gotrue-js']
export const apiPackages = []

// any notes to print out when the job is done
export const notes = [
  'You will need to enable Identity on your Netlify site and set APIUrl to your API endpoint in your GoTrue client config.',
  'See: https://github.com/redwoodjs/redwood/blob/main/packages/auth/README.md#for-gotrue-js',
]
