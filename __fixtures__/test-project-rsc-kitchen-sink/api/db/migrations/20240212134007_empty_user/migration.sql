-- CreateTable
CREATE TABLE "EmptyUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "EmptyUser_email_key" ON "EmptyUser"("email");
