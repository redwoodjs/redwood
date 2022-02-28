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

const user = `model User {
  id                  Int       @id @default(autoincrement())
  email               String    @unique
  hashedPassword      String
  salt                String
  resetToken          String?
  resetTokenExpiresAt DateTime?
  roles               String?
}`

module.exports = { post, contact, user }
