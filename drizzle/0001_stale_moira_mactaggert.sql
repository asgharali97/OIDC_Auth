ALTER TABLE "auth_codes" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_codes" ALTER COLUMN "client_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_codes" ALTER COLUMN "expires_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tokens" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tokens" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "tokens" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tokens" ALTER COLUMN "access_token" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_codes" ADD COLUMN "redirect_uri" text NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_codes" ADD COLUMN "scope" text DEFAULT 'openid' NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_codes" ADD COLUMN "used" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_codes" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "client_secret_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "redirect_uris" text NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "scopes" text[] DEFAULT '{"openid","profile","email"}' NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tokens" ADD COLUMN "client_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tokens" ADD COLUMN "scope" text DEFAULT 'openid' NOT NULL;--> statement-breakpoint
ALTER TABLE "tokens" ADD COLUMN "revoked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tokens" ADD COLUMN "expires_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "tokens" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_codes" ADD CONSTRAINT "auth_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_codes" ADD CONSTRAINT "auth_codes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" DROP COLUMN "client_secret";--> statement-breakpoint
ALTER TABLE "clients" DROP COLUMN "redirect_uri";--> statement-breakpoint
ALTER TABLE "tokens" DROP COLUMN "refresh_token";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password";--> statement-breakpoint
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_access_token_unique" UNIQUE("access_token");