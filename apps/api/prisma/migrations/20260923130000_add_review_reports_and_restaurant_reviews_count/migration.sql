-- AlterTable: adicionar reviews_count em restaurants
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "reviews_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: review_reports
CREATE TABLE IF NOT EXISTS "review_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "review_id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "review_reports_review_id_idx" ON "review_reports"("review_id");
CREATE INDEX IF NOT EXISTS "review_reports_reporter_id_idx" ON "review_reports"("reporter_id");

-- AddForeignKey
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_review_id_fkey"
    FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_reporter_id_fkey"
    FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
