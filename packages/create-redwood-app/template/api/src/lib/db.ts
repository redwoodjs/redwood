// See https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/constructor
// for options.

import { createPrismaClient, defaultLogLevels } from 'src/lib/prisma'

/*
 * Instance of the Prisma Client
 */
export const db = createPrismaClient(defaultLogLevels)
