export const config = {
  imports: [
    `import * as firebase from 'firebase/app'`,
    `import 'firebase/auth'`,
  ],
  init: `const firebaseClientConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
}

const firebaseClient = ((config) => {
  firebase.initializeApp(config)
  return firebase
})(firebaseClientConfig)
  `,
  authProvider: { client: 'firebaseClient', type: 'firebase' },
}

export const packages = ['firebase']

export const notes = [
  'You will need to create several environment variables with your Firebase config options.',
  'Check out web/src/index.js for the variables you need to add.',
  'See: https://firebase.google.com/docs/web/setup#config-object',
]
