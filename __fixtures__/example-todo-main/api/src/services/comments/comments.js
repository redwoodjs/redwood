import { db } from 'src/lib/db'

export const comments = () => {
  return db.comment.findMany()
}
