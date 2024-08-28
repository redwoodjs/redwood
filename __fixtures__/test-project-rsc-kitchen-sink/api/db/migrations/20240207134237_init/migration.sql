-- CreateTable
CREATE TABLE "UserExample" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "UserExample_email_key" ON "UserExample"("email");
