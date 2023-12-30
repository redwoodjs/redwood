/* eslint-env node, es6*/

const post = `model Post {
  id        Int      @id @default(autoincrement())
  title     String
  body      String
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}`

const contact = `model Contact {
  id        Int      @id @default(autoincrement())
  name      String
  email     String
  message   String
  createdAt DateTime @default(now())
}`

const user = `model User {
  id                  Int       @id @default(autoincrement())
  email               String    @unique
  hashedPassword      String
  fullName            String
  salt                String
  resetToken          String?
  resetTokenExpiresAt DateTime?
  roles               String?
  posts               Post[]
}`

module.exports = { post, contact, user }
