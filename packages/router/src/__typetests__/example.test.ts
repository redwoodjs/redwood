import { expectType } from 'tsd-lite'

const users = [
  { name: 'Oby', age: 12 },
  { name: 'Heera', age: 32 },
]

const loggedInUser = users[0].age

expectType<number>(loggedInUser)
