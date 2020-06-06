import fs from 'fs'
import path from 'path'

import { getPaths } from './paths'

// TODO: make this dynamic
export enum SidesEnum {
  API = 'api',
  WEB = 'web',
}

/**
 * Returns array of a project's existing sides
 */
export const getSides = () => {
  const sides = []
  for (const side of Object.values(SidesEnum)) {
    if (fs.existsSync(path.join(getPaths().base, side))) {
      sides.push(side)
    }
  }
  return sides
}

/**
 * Check a project's language. Default to check root dir
 */
export const isTypescript = (side = ''): boolean => {
  if (side && !getSides().includes(side)) {
    throw new Error(`Side "${side}" does not exist in project`)
  }
  return fs.existsSync(path.join(getPaths().base, side, 'tsconfig.json'))
}

/**
 * Check if a project has a Prisma DB directory
 */
export const hasDb = (prismaSchemaCheck: false): boolean => {
  return prismaSchemaCheck
    ? fs.existsSync(getPaths().api.dbSchema)
    : fs.existsSync(getPaths().api.db)
}
