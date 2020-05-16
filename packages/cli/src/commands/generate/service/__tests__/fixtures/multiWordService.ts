import { db } from 'src/lib/db'

export const userProfiles = () => {
  return db.userProfile.findMany()
}
