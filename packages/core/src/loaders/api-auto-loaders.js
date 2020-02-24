// This file is used by babel-auto-import to automatically import modules that are
// used in the api side.
import { PrismaClient } from '@prisma/client'

export const db = new PrismaClient()
