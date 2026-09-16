ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';
ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK ("role" IN ('user', 'restaurant'));

ALTER TABLE "restaurants" ADD COLUMN "phone" TEXT;
ALTER TABLE "restaurants" ADD COLUMN "cnpj" TEXT;
CREATE UNIQUE INDEX "restaurants_cnpj_key" ON "restaurants"("cnpj");

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, updated_at)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'role', 'user'), NOW());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
