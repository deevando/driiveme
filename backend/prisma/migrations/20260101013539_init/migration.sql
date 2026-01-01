-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fromCity" TEXT NOT NULL,
    "toCity" TEXT NOT NULL,
    "vehicle" TEXT NOT NULL,
    "price" REAL,
    "pickupDate" DATETIME,
    "dropoffDate" DATETIME,
    "link" TEXT NOT NULL,
    "distance" INTEGER,
    "rawJson" TEXT NOT NULL,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Filter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "keywords" TEXT,
    "minPrice" REAL,
    "maxPrice" REAL,
    "origin" TEXT,
    "destination" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Offer_externalId_key" ON "Offer"("externalId");

-- CreateIndex
CREATE INDEX "Offer_fromCity_toCity_idx" ON "Offer"("fromCity", "toCity");

-- CreateIndex
CREATE INDEX "Offer_detectedAt_idx" ON "Offer"("detectedAt");
