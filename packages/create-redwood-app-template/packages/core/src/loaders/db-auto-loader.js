// This file is used by babel-auto-import to automatically initialize the
// `db` imports in the API side.
import { PrismaClient } from '@prisma/client'

export default new PrismaClient()
