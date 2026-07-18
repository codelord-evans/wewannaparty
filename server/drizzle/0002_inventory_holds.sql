CREATE TABLE IF NOT EXISTS "inventory_holds" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "ticket_type_id" integer NOT NULL,
  "quantity" integer NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_holds" ADD CONSTRAINT "inventory_holds_ticket_type_id_ticket_types_id_fk" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inventory_holds_ticket_idx" ON "inventory_holds" USING btree ("ticket_type_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inventory_holds_expires_idx" ON "inventory_holds" USING btree ("expires_at");
