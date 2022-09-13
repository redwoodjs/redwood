import GoTrue from 'gotrue-js'

import { createGoTrueAuth } from '@redwoodjs/auth-providers-web'

const goTrueClient = new GoTrue({
  APIUrl: 'https://MYAPP.netlify.app/.netlify/identity',
  setCookie: true,
})

export const { AuthProvider, useAuth } = createGoTrueAuth(goTrueClient)
