import fs from 'fs'
import path from 'path'

import password from 'secure-random-password'

import { getPaths, colors } from '@redwoodjs/cli-helpers'

export const libPath = getPaths().api.lib.replace(getPaths().base, '')
export const functionsPath = getPaths().api.functions.replace(
  getPaths().base,
  ''
)

export const extraTask = {
  title: 'Adding SESSION_SECRET...',
  task: () => {
    const envPath = path.join(getPaths().base, '.env')
    const secret = password.randomPassword({
      length: 64,
      characters: [password.lower, password.upper, password.digits],
    })
    const content = [
      '# Used to encrypt/decrypt session cookies. Change this value and re-deploy to log out all users of your app at once.',
      `SESSION_SECRET=${secret}`,
      '',
    ]
    let envFile = ''

    if (fs.existsSync(envPath)) {
      envFile = fs.readFileSync(envPath).toString() + '\n'
    }

    fs.writeFileSync(envPath, envFile + content.join('\n'))
  },
}

// any notes to print out when the job is done
export const notes = [
  `${colors.warning('Done! But you have a little more work to do:')}\n`,
  'You will need to add a couple of fields to your User table in order',
  'to store a hashed password and salt:',
  '',
  '  model User {',
  '    id                  Int @id @default(autoincrement())',
  '    email               String  @unique',
  '    hashedPassword      String    // <─┐',
  '    salt                String    // <─┼─ add these lines',
  '    resetToken          String?   // <─┤',
  '    resetTokenExpiresAt DateTime? // <─┘',
  '  }',
  '',
  'If you already have existing user records you will need to provide',
  'a default value for `hashedPassword` and `salt` or Prisma complains, so',
  'change those to: ',
  '',
  '  hashedPassword String @default("")',
  '  salt           String @default("")',
  '',
  'If you expose any of your user data via GraphQL be sure to exclude',
  '`hashedPassword` and `salt` (or whatever you named them) from the',
  'SDL file that defines the fields for your user.',
  '',
  "You'll need to let Redwood know what fields you're using for your",
  "users' `id` and `username` fields. In this case we're using `id` and",
  '`email`, so update those in the `authFields` config in',
  `\`${functionsPath}/auth.js\` (this is also the place to tell Redwood if`,
  'you used a different name for the `hashedPassword`, `salt`,',
  '`resetToken` or `resetTokenExpiresAt`, fields:`',
  '',
  '  authFields: {',
  "    id: 'id',",
  "    username: 'email',",
  "    hashedPassword: 'hashedPassword',",
  "    salt: 'salt',",
  "    resetToken: 'resetToken',",
  "    resetTokenExpiresAt: 'resetTokenExpiresAt',",
  '  },',
  '',
  "To get the actual user that's logged in, take a look at `getCurrentUser()`",
  `in \`${libPath}/auth.js\`. We default it to something simple, but you may`,
  'use different names for your model or unique ID fields, in which case you',
  'need to update those calls (instructions are in the comment above the code).',
  '',
  'Finally, we created a SESSION_SECRET environment variable for you in',
  `${path.join(getPaths().base, '.env')}. This value should NOT be checked`,
  'into version control and should be unique for each environment you',
  'deploy to. If you ever need to log everyone out of your app at once',
  'change this secret to a new value and deploy. To create a new secret, run:',
  '',
  '  yarn rw generate secret',
  '',
  "Need simple Login, Signup and Forgot Password pages? We've got a generator",
  'for those as well:',
  '',
  '  yarn rw generate dbAuth',
]
