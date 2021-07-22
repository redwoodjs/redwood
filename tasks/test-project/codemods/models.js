#!/usr/bin/env node

const post = `model Post {
  id        Int      @id @default(autoincrement())
  title     String
  body      String
  createdAt DateTime @default(now())
}`

const contact = `model Contact {
  id        Int @id @default(autoincrement())
  name      String
  email     String
  message   String
  createdAt DateTime @default(now())
}`

module.exports = { post, contact }
