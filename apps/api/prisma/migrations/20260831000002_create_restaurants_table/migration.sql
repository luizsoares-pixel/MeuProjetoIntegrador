-- Migration: create_restaurants_table
-- Issue #33: Endpoint de Restaurantes Próximos (Backend)

CREATE TABLE "restaurants" (
    "id"         UUID             NOT NULL DEFAULT gen_random_uuid(),
    "name"       TEXT             NOT NULL,
    "address"    TEXT             NOT NULL,
    "image_url"  TEXT,
    "latitude"   DOUBLE PRECISION NOT NULL,
    "longitude"  DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);
