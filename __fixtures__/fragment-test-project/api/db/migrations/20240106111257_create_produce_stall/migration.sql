-- CreateTable
CREATE TABLE "Produce" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "nutrients" TEXT,
    "region" TEXT NOT NULL,
    "isSeedless" BOOLEAN,
    "ripenessIndicators" TEXT,
    "vegetableFamily" TEXT,
    "isPickled" BOOLEAN,
    "stallId" TEXT NOT NULL,
    CONSTRAINT "Produce_stallId_fkey" FOREIGN KEY ("stallId") REFERENCES "Stall" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Stall" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "stallNumber" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Produce_name_key" ON "Produce"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Stall_stallNumber_key" ON "Stall"("stallNumber");
