import { db } from 'src/lib/db'

export const textComments = () => {
  return db.textComment.findMany()
}
