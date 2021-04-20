import { db } from 'src/lib/db'
import { requireAuth } from 'src/lib/auth'

export const beforeResolver = (rules) => {
  rules.apply(requireAuth)
}

export const users = () => {
  return db.user.findMany()
}

export const User = {
  userProfiles: (_obj, { root }) =>
    db.user.findUnique({ where: { id: root.id } }).userProfiles(),
  identity: (_obj, { root }) =>
    db.user.findUnique({ where: { id: root.id } }).identity(),
}
