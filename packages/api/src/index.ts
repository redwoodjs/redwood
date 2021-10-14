export * from './auth'
export * from './functions/dbAuth/DbAuthHandler'
export { dbAuthSession } from './functions/dbAuth/shared'
export * from './validations/validations'
export * from './validations/errors'

// @NOTE: use require, to avoid messing around with tsconfig and nested output dirs
const packageJson = require('../package.json')
export const prismaVersion = packageJson?.dependencies['@prisma/client']
export const redwoodVersion = packageJson?.version
