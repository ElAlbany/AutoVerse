BEGIN;
CREATE EXTENSION IF NOT EXISTS btree_gist;
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'REFUND_PENDING', 'REFUNDED', 'FAILED');

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_carId_fkey";

-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "location" TEXT NOT NULL DEFAULT 'Main collection point',
ADD COLUMN     "luggage" INTEGER,
ADD COLUMN     "seats" INTEGER;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "inventoryConflict" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'usd',
ADD COLUMN     "dailyRate" DECIMAL(10,2),
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "policy" JSONB,
ADD COLUMN     "requestKey" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "stripeSessionId" TEXT,
ADD COLUMN     "vehicleName" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moderationReason" TEXT,
ADD COLUMN     "reported" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "VehicleUnit" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleReservation" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "orderId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT NOT NULL DEFAULT 'Rental',

    CONSTRAINT "VehicleReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "userId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId","carId")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "actorId" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleUnit_code_key" ON "VehicleUnit"("code");

-- CreateIndex
CREATE INDEX "VehicleUnit_carId_enabled_idx" ON "VehicleUnit"("carId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleReservation_orderId_key" ON "VehicleReservation"("orderId");

-- CreateIndex
CREATE INDEX "VehicleReservation_unitId_active_startDate_endDate_idx" ON "VehicleReservation"("unitId", "active", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "OrderEvent_orderId_createdAt_idx" ON "OrderEvent"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_key_key" ON "Notification"("key");

-- CreateIndex
CREATE INDEX "Notification_sentAt_nextAttemptAt_idx" ON "Notification"("sentAt", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "RateLimit_resetAt_idx" ON "RateLimit"("resetAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_requestKey_key" ON "Order"("requestKey");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "Order"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripePaymentIntentId_key" ON "Order"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_expiresAt_idx" ON "Order"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Order_carId_startDate_endDate_idx" ON "Order"("carId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Review_carId_hidden_createdAt_idx" ON "Review"("carId", "hidden", "createdAt");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleUnit" ADD CONSTRAINT "VehicleUnit_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleReservation" ADD CONSTRAINT "VehicleReservation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "VehicleUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleReservation" ADD CONSTRAINT "VehicleReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- One initial unit per listing. Staff must explicitly add audited fleet inventory.
INSERT INTO "VehicleUnit" (id, "carId", code)
SELECT 'unit-' || id, id, 'AV-' || id FROM "Car";
UPDATE "Order" o SET "dailyRate" = c."pricePerDay", "vehicleName" = c.year || ' ' || c.make || ' ' || c.model,
  policy = '{"version":"legacy","cancellationHours":48,"turnaroundMinutes":60}'::jsonb
FROM "Car" c WHERE c.id = o."carId";
-- Quarantine ambiguous legacy schedules without deleting bookings or inventing stock.
UPDATE "Order" SET "inventoryConflict" = true WHERE "carId" IN (
  SELECT a."carId" FROM "Order" a JOIN "Order" b ON a."carId" = b."carId" AND a.id < b.id
  WHERE a.status IN ('PENDING','CONFIRMED','ACTIVE') AND b.status IN ('PENDING','CONFIRMED','ACTIVE')
  AND a."endDate" > NOW() AND b."endDate" > NOW()
  AND a."startDate" < b."endDate" + INTERVAL '1 hour' AND b."startDate" < a."endDate" + INTERVAL '1 hour'
) AND status IN ('PENDING','CONFIRMED','ACTIVE') AND "endDate" > NOW();
UPDATE "Car" SET available = false WHERE id IN (SELECT "carId" FROM "Order" WHERE "inventoryConflict");
INSERT INTO "VehicleReservation" (id, "unitId", "orderId", "startDate", "endDate", active)
SELECT 'reservation-' || id, 'unit-' || "carId", id, "startDate", "endDate" + INTERVAL '1 hour',
  status IN ('PENDING','CONFIRMED','ACTIVE') AND "endDate" > NOW() AND NOT "inventoryConflict" FROM "Order" WHERE "endDate" > "startDate";
ALTER TABLE "VehicleReservation" ADD CONSTRAINT reservation_positive_range CHECK ("endDate" > "startDate");
ALTER TABLE "VehicleReservation" ADD CONSTRAINT no_overlapping_vehicle_reservations
  EXCLUDE USING gist ("unitId" WITH =, tsrange("startDate", "endDate", '[)') WITH &&) WHERE (active);
ALTER TABLE "Order" ADD CONSTRAINT order_positive_range CHECK ("endDate" > "startDate") NOT VALID;
ALTER TABLE "Order" ADD CONSTRAINT order_positive_total CHECK ("totalPrice" > 0) NOT VALID;
ALTER TABLE "Review" ADD CONSTRAINT review_rating_range CHECK (rating BETWEEN 1 AND 5) NOT VALID;
ALTER TABLE "Car" ADD CONSTRAINT car_capacity CHECK ((seats IS NULL OR seats BETWEEN 1 AND 20) AND (luggage IS NULL OR luggage BETWEEN 0 AND 20));
COMMIT;
