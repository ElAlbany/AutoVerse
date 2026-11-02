BEGIN;
ALTER TABLE "Car" ADD COLUMN "branchId" TEXT NOT NULL DEFAULT 'branch-main', ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 0;
UPDATE "Branch" SET name = 'Frankfurt International Airport', city = 'Frankfurt' WHERE id = 'branch-main';

-- Keep the original ID at its established branch. Clone only genuinely shared
-- legacy listings, and move their units/orders/reviews without losing history.
UPDATE "Car" c SET "branchId" = COALESCE(
  (SELECT u."branchId" FROM "VehicleUnit" u WHERE u."carId" = c.id ORDER BY (u."branchId" = 'branch-main') DESC, u."createdAt", u.id LIMIT 1),
  (SELECT o."branchId" FROM "Order" o WHERE o."carId" = c.id AND o."branchId" IS NOT NULL ORDER BY o."createdAt", o.id LIMIT 1),
  'branch-main'
);
UPDATE "Order" o SET "branchId" = COALESCE(
  (SELECT u."branchId" FROM "VehicleReservation" r JOIN "VehicleUnit" u ON u.id = r."unitId" WHERE r."orderId" = o.id),
  o."branchId", c."branchId"
) FROM "Car" c WHERE c.id = o."carId";
CREATE TEMP TABLE "_CarBranchSplit" ON COMMIT DROP AS
SELECT DISTINCT c.id AS "originalId", branches."branchId",
  CASE WHEN branches."branchId" = c."branchId" THEN c.id ELSE gen_random_uuid()::text END AS "targetId"
FROM "Car" c JOIN (
  SELECT id AS "carId", "branchId" FROM "Car"
  UNION SELECT "carId", "branchId" FROM "VehicleUnit"
  UNION SELECT "carId", "branchId" FROM "Order" WHERE "branchId" IS NOT NULL
) branches ON branches."carId" = c.id;
INSERT INTO "Car" ("id", "make", "model", "year", "pricePerDay", "fuel_type", "transmission", "drive", "city_mpg", "class", "combination_mpg", "cylinders", "displacement", "highway_mpg", "images", "description", "available", "featured", "archived", "seats", "luggage", "features", "location", "branchId", "quantity", "imageSource", "usageTags", "groundClearanceMm", "lowRange4x4", "suitableTyres", "roughRoadApproved", "createdAt")
SELECT m."targetId", c."make", c."model", c."year", c."pricePerDay", c."fuel_type", c."transmission", c."drive", c."city_mpg", c."class", c."combination_mpg", c."cylinders", c."displacement", c."highway_mpg", c."images", c."description", c."available", c."featured", c."archived", c."seats", c."luggage", c."features", b.name, m."branchId", 0, c."imageSource", c."usageTags", c."groundClearanceMm", c."lowRange4x4", c."suitableTyres", c."roughRoadApproved", c."createdAt"
FROM "_CarBranchSplit" m JOIN "Car" c ON c.id = m."originalId" JOIN "Branch" b ON b.id = m."branchId" WHERE m."targetId" <> m."originalId";

UPDATE "VehicleUnit" u SET "carId" = m."targetId" FROM "_CarBranchSplit" m WHERE u."carId" = m."originalId" AND u."branchId" = m."branchId";
UPDATE "Order" o SET "carId" = m."targetId" FROM "_CarBranchSplit" m WHERE o."carId" = m."originalId" AND o."branchId" = m."branchId";
UPDATE "Review" r SET "carId" = o."carId" FROM "Order" o WHERE o.id = r."orderId";
UPDATE "Car" c SET location = b.name, quantity = (SELECT COUNT(*)::int FROM "VehicleUnit" u WHERE u."carId" = c.id AND u.enabled) FROM "Branch" b WHERE b.id = c."branchId";
ALTER TABLE "Car" ALTER COLUMN location SET DEFAULT 'Frankfurt International Airport';
CREATE UNIQUE INDEX "Car_id_branchId_key" ON "Car"(id, "branchId");
CREATE INDEX "Car_branchId_archived_available_idx" ON "Car"("branchId", archived, available);
ALTER TABLE "Car" ADD CONSTRAINT "Car_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Car" ADD CONSTRAINT "Car_quantity_nonnegative" CHECK (quantity >= 0);
-- These additional composite constraints complement Prisma's single-ID
-- relations and prevent any writer from borrowing another branch's stock.
ALTER TABLE "VehicleUnit" ADD CONSTRAINT "VehicleUnit_listing_branch_fkey" FOREIGN KEY ("carId", "branchId") REFERENCES "Car"(id, "branchId") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "Order" ADD CONSTRAINT "Order_listing_branch_fkey" FOREIGN KEY ("carId", "branchId") REFERENCES "Car"(id, "branchId") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE FUNCTION sync_car_quantity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.enabled THEN UPDATE "Car" SET quantity = quantity + 1 WHERE id = NEW."carId"; END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.enabled THEN UPDATE "Car" SET quantity = quantity - 1 WHERE id = OLD."carId"; END IF;
  ELSIF OLD."carId" = NEW."carId" THEN
    UPDATE "Car" SET quantity = quantity + NEW.enabled::int - OLD.enabled::int WHERE id = NEW."carId";
  ELSE
    IF OLD.enabled THEN UPDATE "Car" SET quantity = quantity - 1 WHERE id = OLD."carId"; END IF;
    IF NEW.enabled THEN UPDATE "Car" SET quantity = quantity + 1 WHERE id = NEW."carId"; END IF;
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER "VehicleUnit_sync_quantity" AFTER INSERT OR DELETE OR UPDATE OF "carId", enabled ON "VehicleUnit" FOR EACH ROW EXECUTE FUNCTION sync_car_quantity();
COMMIT;
