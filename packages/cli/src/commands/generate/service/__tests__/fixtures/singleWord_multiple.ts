import { Prisma } from '@prisma/client'
import { ResolverArgs } from '@redwoodjs/api/dist/types'
import { db } from 'src/lib/db'
import { requireAuth } from 'src/lib/auth'

export const beforeResolver = (rules) => {
  rules.apply(requireAuth)
}

export const users = () => {
  return db.user.findMany()
}

export const User = {
  userProfiles: (_obj, { root }: ResolverArgs<Prisma.UserWhereUniqueInput>) =>
    db.user.findUnique({ where: { id: root.id } }).userProfiles(),
  identity: (_obj, { root }: ResolverArgs<Prisma.UserWhereUniqueInput>) =>
    db.user.findUnique({ where: { id: root.id } }).identity(),
}
