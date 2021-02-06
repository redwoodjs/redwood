import { deployBuilder, deployHandler } from './helpers/helpers'

export const command = 'vercel [...commands]'
export const description = 'Build command for Vercel deploy'

export const builder = (yargs) => deployBuilder(yargs)

export const handler = deployHandler
