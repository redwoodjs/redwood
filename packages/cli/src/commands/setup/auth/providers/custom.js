import { isTypeScriptProject } from '../../../../lib/project'

// required packages to install
export const webPackages = []
export const apiPackages = []

const authFilename = isTypeScriptProject() ? 'auth.ts' : 'auth.js'

// any notes to print out when the job is done
export const notes = [
  'Done! But you have a little more work to do:\n',
  'You will have to write the actual auth implementation/integration',
  `yourself. Take a look in ${authFilename} and do the changes necessary.`,
]
