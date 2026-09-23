-- AlterTable: adicionar rating e reviews_count em menu_items
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "reviews_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: reviews
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "restaurant_id" UUID,
    "menu_item_id" UUID,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "reply" TEXT,
    "replied_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable: review_photos
CREATE TABLE IF NOT EXISTS "review_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "review_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable: favorite_restaurants
CREATE TABLE IF NOT EXISTS "favorite_restaurants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable: favorite_dishes
CREATE TABLE IF NOT EXISTS "favorite_dishes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_dishes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reviews_restaurant_id_idx" ON "reviews"("restaurant_id");
CREATE INDEX IF NOT EXISTS "reviews_menu_item_id_idx" ON "reviews"("menu_item_id");
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_user_id_restaurant_id_key" ON "reviews"("user_id", "restaurant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_user_id_menu_item_id_key" ON "reviews"("user_id", "menu_item_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "review_photos_review_id_idx" ON "review_photos"("review_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "favorite_restaurants_user_id_idx" ON "favorite_restaurants"("user_id");
CREATE INDEX IF NOT EXISTS "favorite_restaurants_restaurant_id_idx" ON "favorite_restaurants"("restaurant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "favorite_restaurants_user_id_restaurant_id_key" ON "favorite_restaurants"("user_id", "restaurant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "favorite_dishes_user_id_idx" ON "favorite_dishes"("user_id");
CREATE INDEX IF NOT EXISTS "favorite_dishes_menu_item_id_idx" ON "favorite_dishes"("menu_item_id");
CREATE UNIQUE INDEX IF NOT EXISTS "favorite_dishes_user_id_menu_item_id_key" ON "favorite_dishes"("user_id", "menu_item_id");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_restaurant_id_fkey"
    FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_menu_item_id_fkey"
    FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_photos" ADD CONSTRAINT "review_photos_review_id_fkey"
    FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_restaurants" ADD CONSTRAINT "favorite_restaurants_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "favorite_restaurants" ADD CONSTRAINT "favorite_restaurants_restaurant_id_fkey"
    FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_dishes" ADD CONSTRAINT "favorite_dishes_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "favorite_dishes" ADD CONSTRAINT "favorite_dishes_menu_item_id_fkey"
    FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
