import yargs from 'yargs'
import { standardAuthBuilder, standardAuthHandler } from '../../setupHelpers'

export const command = 'auth netlify'
export const description = 'Generate an auth configuration for Netlify'
export const builder = (yargs: yargs.Argv) => {
  return standardAuthBuilder(yargs)
}

interface Args {
  rwVersion: string
  force: boolean
}

export const handler = async ({ rwVersion, force: forceArg }: Args) => {
  standardAuthHandler({
    rwVersion,
    forceArg,
    provider: 'netlify',
    webAuthn: false,
  })
}
