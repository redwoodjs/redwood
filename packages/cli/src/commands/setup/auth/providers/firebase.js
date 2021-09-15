// the lines that need to be added to App.{js,tsx}
export const config = {
  imports: [
    `import { initializeApp, getApp, getApps } from 'firebase/app'`,
    `import * as firebaseAuth from '@firebase/auth'`,
  ],
  init: `const firebaseClientConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
}

const firebaseApp = ((config) => {
  const apps = getApps()
  if (!apps.length) {
    initializeApp(config)
  }
  return getApp()
})(firebaseClientConfig)

export const firebaseClient = {
  firebaseAuth,
  firebaseApp, // optional
}`,
  authProvider: { client: 'firebaseClient', type: 'firebase' },
}

// required packages to install
export const webPackages = ['firebase']
export const apiPackages = ['firebase-admin']

// any notes to print out when the job is done
export const notes = [
  'You will need to create several environment variables with your Firebase config options.',
  'Check out web/src/App.{js,tsx} for the variables you need to add.',
  'See: https://firebase.google.com/docs/web/setup#config-object',
]
