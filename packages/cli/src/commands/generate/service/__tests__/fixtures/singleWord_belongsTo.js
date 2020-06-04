import { db } from 'src/lib/db'

export const users = () => {
  return db.user.findMany()
}

export const User = {
  identity: (_obj, { root }) =>
    db.user.findOne({ where: { id: root.id } }).identity(),
}
