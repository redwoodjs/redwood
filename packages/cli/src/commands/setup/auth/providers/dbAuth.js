// the lines that need to be added to App.{js,tsx}
export const config = {
  imports: [],
  authProvider: {
    type: 'dbAuth',
  },
}

// required packages to install
export const webPackages = []
export const apiPackages = []

// any notes to print out when the job is done
export const notes = [
  'You will need to add a couple of fields to your User table in order',
  'to store their hashed password and salt values. You can name them',
  'something custom if you wish, just be sure to update the `authFields`',
  'option in `api/src/functions/auth.js` to let Redwood know what you',
  'called them:',
  '',
  '  model User {',
  '    id              Int @id  @default(autoincrement())',
  '    email           String   @unique',
  '    hashedPassword  String   // <--- add this line',
  '    salt            String   // <--- and this one',
  '  }',
  '',
  'If you already have existing user records you will need to provide',
  'a default value or Prisma complains, so change those to:',
  '',
  '  hashedPassword  String   @default("")',
  '  salt            String   @default("")',
  '',
  "Need simple Login and Signup pages? We've got a generator for those",
  'as well:',
  '',
  '  yarn rw g scaffold dbAuth',
]
