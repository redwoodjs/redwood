import { commonDeployOptions, buildAndMigratePrisma } from '../deploy'

export const command = 'vercel [...commands]'
export const description = 'Build command for Vercel deploy'

export const builder = (yargs) => commonDeployOptions(yargs)

export const handler = buildAndMigratePrisma
