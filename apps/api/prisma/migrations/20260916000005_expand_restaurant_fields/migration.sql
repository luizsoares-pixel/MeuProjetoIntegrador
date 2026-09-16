-- CreateEnum
CREATE TYPE "PriceRange" AS ENUM ('$', '$$', '$$$');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'MEAL_VOUCHER');

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN "description" TEXT,
ADD COLUMN "price_range" "PriceRange",
ADD COLUMN "business_hours" JSONB,
ADD COLUMN "payment_methods" "PaymentMethod"[] DEFAULT ARRAY[]::"PaymentMethod"[],
ADD COLUMN "social_links" JSONB,
ADD COLUMN "street" TEXT,
ADD COLUMN "number" TEXT,
ADD COLUMN "complement" TEXT,
ADD COLUMN "neighborhood" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "state" VARCHAR(2),
ADD COLUMN "postal_code" TEXT;

-- CreateTable
CREATE TABLE "restaurant_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_photos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "restaurant_photos" ADD CONSTRAINT "restaurant_photos_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
