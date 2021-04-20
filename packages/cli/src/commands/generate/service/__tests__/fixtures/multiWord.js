import { db } from 'src/lib/db'
import { requireAuth } from 'src/lib/auth'

export const beforeResolver = (rules) => {
  rules.apply(requireAuth)
}

export const userProfiles = () => {
  return db.userProfile.findMany()
}
