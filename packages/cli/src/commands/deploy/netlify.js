import { commonDeployOptions, buildAndMigratePrisma } from '../deploy'

export const command = 'netlify [...commands]'
export const description = 'Build command for Netlify deploy'

export const builder = (yargs) => commonDeployOptions(yargs)

export const handler = buildAndMigratePrisma
