CREATE TYPE "public"."order_status" AS ENUM('pending', 'awaiting_payment', 'paid', 'failed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('mpesa', 'card');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"phone" varchar(32),
	"password_hash" text NOT NULL,
	"role" varchar(32) DEFAULT 'customer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"poster" text NOT NULL,
	"date" varchar(32) NOT NULL,
	"start_time" varchar(16) NOT NULL,
	"end_time" varchar(16) NOT NULL,
	"doors_open" varchar(16) NOT NULL,
	"venue_name" varchar(255) NOT NULL,
	"location" varchar(255) NOT NULL,
	"category" varchar(64) NOT NULL,
	"dress_code" varchar(128) NOT NULL,
	"refund_policy" varchar(128) NOT NULL,
	"age_restriction" varchar(32) NOT NULL,
	"event_type" varchar(64) DEFAULT 'ticketed' NOT NULL,
	"service_fee_kes" integer DEFAULT 40 NOT NULL,
	"parking" varchar(128),
	"organizer" varchar(128),
	"status" varchar(32) DEFAULT 'approved' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "ticket_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_kes" integer NOT NULL,
	"capacity" integer DEFAULT 1000 NOT NULL,
	"sold_count" integer DEFAULT 0 NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"highlighted" boolean DEFAULT false NOT NULL,
	"badge" varchar(32),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "artists" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"genre" varchar(128) NOT NULL,
	"instagram_url" text,
	"photo_url" text NOT NULL
);--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(16) NOT NULL,
	"title" varchar(255) NOT NULL,
	"venue" varchar(255) NOT NULL,
	"event_date" varchar(32) NOT NULL,
	"image_url" text,
	"video_url" text,
	"thumbnail_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"event_id" integer NOT NULL,
	"event_slug" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"subtotal_kes" integer NOT NULL,
	"service_fee_kes" integer NOT NULL,
	"total_kes" integer NOT NULL,
	"currency" varchar(8) DEFAULT 'KES' NOT NULL,
	"paystack_reference" varchar(128),
	"idempotency_key" varchar(128),
	"hold_token" varchar(64),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar(32) NOT NULL,
	"ticket_type_id" integer NOT NULL,
	"ticket_name" varchar(255) NOT NULL,
	"unit_price_kes" integer NOT NULL,
	"quantity" integer NOT NULL
);--> statement-breakpoint
CREATE TABLE "issued_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar(32) NOT NULL,
	"order_item_id" uuid NOT NULL,
	"ticket_code" varchar(64) NOT NULL,
	"qr_payload" text NOT NULL,
	"seat_label" varchar(32),
	"status" varchar(32) DEFAULT 'valid' NOT NULL,
	"checked_in_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"order_id" varchar(32),
	"message" text NOT NULL,
	"ticket_id" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_ticket_type_id_ticket_types_id_fk" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_tickets" ADD CONSTRAINT "issued_tickets_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_tickets" ADD CONSTRAINT "issued_tickets_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uidx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_uidx" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ticket_types_event_idx" ON "ticket_types" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "orders_email_idx" ON "orders" USING btree ("email");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_paystack_ref_uidx" ON "orders" USING btree ("paystack_reference") WHERE "paystack_reference" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_idempotency_uidx" ON "orders" USING btree ("idempotency_key") WHERE "idempotency_key" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "issued_tickets_code_uidx" ON "issued_tickets" USING btree ("ticket_code");
