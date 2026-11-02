BEGIN;
-- Existing demo listings receive explicit rental configurations. Operators must
-- verify seats against the actual trim before deploying a real fleet.
UPDATE "Car" SET seats = CASE
  WHEN lower(make || ' ' || model) = 'acura mdx' THEN 7
  WHEN lower(make || ' ' || model) = 'audi q7' THEN 7
  WHEN lower(make || ' ' || model) = 'ford explorer' THEN 7
  WHEN lower(make || ' ' || model) = 'gmc acadia' THEN 6
  WHEN lower(make || ' ' || model) = 'kia telluride' THEN 8
  WHEN lower(make || ' ' || model) = 'mitsubishi outlander' THEN 7
  ELSE 5 END WHERE seats IS NULL;
-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "groundClearanceMm" INTEGER,
ADD COLUMN     "imageSource" TEXT NOT NULL DEFAULT 'API',
ADD COLUMN     "lowRange4x4" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "roughRoadApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suitableTyres" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "usageTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "seats" SET NOT NULL,
ALTER COLUMN "seats" SET DEFAULT 5;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "VehicleUnit" ADD COLUMN     "branchId" TEXT NOT NULL DEFAULT 'branch-main';

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Branch_name_key" ON "Branch"("name");

-- CreateIndex
CREATE INDEX "Branch_active_city_idx" ON "Branch"("active", "city");

-- CreateIndex
CREATE INDEX "Order_branchId_startDate_endDate_idx" ON "Order"("branchId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "VehicleUnit_branchId_carId_enabled_idx" ON "VehicleUnit"("branchId", "carId", "enabled");

-- Keep the existing collection points and assign real units to their branch.
INSERT INTO "Branch" (id, name, city) VALUES ('branch-main', 'Main collection point', 'Main collection point');
INSERT INTO "Branch" (id, name, city)
SELECT 'branch-' || md5(location), location, location FROM "Car" WHERE location <> 'Main collection point' GROUP BY location;
UPDATE "VehicleUnit" u SET "branchId" = CASE WHEN c.location = 'Main collection point' THEN 'branch-main' ELSE 'branch-' || md5(c.location) END FROM "Car" c WHERE c.id = u."carId";
UPDATE "Order" o SET "branchId" = u."branchId" FROM "VehicleReservation" r JOIN "VehicleUnit" u ON u.id = r."unitId" WHERE r."orderId" = o.id;
UPDATE "Car" SET "usageTags" = CASE WHEN class ILIKE '%truck%' THEN ARRAY['INTERCITY'] ELSE ARRAY['CITY','INTERCITY'] END;
UPDATE "Car" SET "imageSource" = 'UPLOADED' WHERE EXISTS (SELECT 1 FROM unnest(images) src WHERE src LIKE 'https://%' AND src NOT LIKE '%imagin.studio%');

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleUnit" ADD CONSTRAINT "VehicleUnit_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
