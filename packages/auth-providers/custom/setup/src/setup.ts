import yargs from 'yargs'

import {
  isTypeScriptProject,
  standardAuthBuilder,
  standardAuthHandler,
} from '@redwoodjs/cli-helpers'

export const command = 'custom'
export const description = 'Generate a custom auth configuration'
export const builder = (yargs: yargs.Argv) => {
  return standardAuthBuilder(yargs)
}

interface Args {
  rwVersion: string
  force: boolean
}

export const handler = async ({ rwVersion, force: forceArg }: Args) => {
  const authFilename = isTypeScriptProject() ? 'auth.ts' : 'auth.js'

  standardAuthHandler({
    basedir: __dirname,
    rwVersion,
    forceArg,
    provider: 'custom',
    notes: [
      'Done! But you have a little more work to do:\n',
      'You will have to write the actual auth implementation/integration',
      `yourself. Take a look in ${authFilename} and do the necessary changes.`,
    ],
  })
}
