import packageJson from '../package.json'

export * from './auth'
export * from './functions/dbAuth/DbAuthHandler'
export { dbAuthSession } from './functions/dbAuth/shared'

export const prismaVersion = packageJson?.dependencies['@prisma/client']
export const redwoodVersion = packageJson?.version
