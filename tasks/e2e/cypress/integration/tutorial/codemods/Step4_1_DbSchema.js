export default `
// api/prisma/schema.prisma

datasource DS {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = env("BINARY_TARGET")
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  body      String
  createdAt DateTime @default(now())
}
`