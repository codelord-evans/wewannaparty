import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  index,
} from "drizzle-orm/pg-core";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "awaiting_payment",
  "paid",
  "failed",
  "cancelled",
  "refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method", ["mpesa", "card"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    passwordHash: text("password_hash").notNull(),
    role: varchar("role", { length: 32 }).notNull().default("customer"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_email_uidx").on(t.email)],
);

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description").notNull(),
    poster: text("poster").notNull(),
    date: varchar("date", { length: 32 }).notNull(),
    startTime: varchar("start_time", { length: 16 }).notNull(),
    endTime: varchar("end_time", { length: 16 }).notNull(),
    doorsOpen: varchar("doors_open", { length: 16 }).notNull(),
    venueName: varchar("venue_name", { length: 255 }).notNull(),
    location: varchar("location", { length: 255 }).notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    dressCode: varchar("dress_code", { length: 128 }).notNull(),
    refundPolicy: varchar("refund_policy", { length: 128 }).notNull(),
    ageRestriction: varchar("age_restriction", { length: 32 }).notNull(),
    eventType: varchar("event_type", { length: 64 }).notNull().default("ticketed"),
    serviceFeeKes: integer("service_fee_kes").notNull().default(40),
    parking: varchar("parking", { length: 128 }),
    organizer: varchar("organizer", { length: 128 }),
    status: varchar("status", { length: 32 }).notNull().default("approved"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("events_slug_uidx").on(t.slug), index("events_status_idx").on(t.status)],
);

export const ticketTypes = pgTable(
  "ticket_types",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull().default(""),
    priceKes: integer("price_kes").notNull(),
    capacity: integer("capacity").notNull().default(1000),
    soldCount: integer("sold_count").notNull().default(0),
    available: boolean("available").notNull().default(true),
    highlighted: boolean("highlighted").notNull().default(false),
    badge: varchar("badge", { length: 32 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("ticket_types_event_idx").on(t.eventId)],
);

export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  genre: varchar("genre", { length: 128 }).notNull(),
  instagramUrl: text("instagram_url"),
  photoUrl: text("photo_url").notNull(),
});

export const galleryItems = pgTable("gallery_items", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 16 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  venue: varchar("venue", { length: 255 }).notNull(),
  eventDate: varchar("event_date", { length: 32 }).notNull(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable(
  "orders",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id),
    eventSlug: varchar("event_slug", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    status: orderStatusEnum("status").notNull().default("pending"),
    subtotalKes: integer("subtotal_kes").notNull(),
    serviceFeeKes: integer("service_fee_kes").notNull(),
    totalKes: integer("total_kes").notNull(),
    currency: varchar("currency", { length: 8 }).notNull().default("KES"),
    paystackReference: varchar("paystack_reference", { length: 128 }),
    idempotencyKey: varchar("idempotency_key", { length: 128 }),
    holdToken: varchar("hold_token", { length: 64 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("orders_email_idx").on(t.email),
    index("orders_status_idx").on(t.status),
    uniqueIndex("orders_paystack_ref_uidx").on(t.paystackReference),
    uniqueIndex("orders_idempotency_uidx").on(t.idempotencyKey),
  ],
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: varchar("order_id", { length: 32 })
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  ticketTypeId: integer("ticket_type_id")
    .notNull()
    .references(() => ticketTypes.id),
  ticketName: varchar("ticket_name", { length: 255 }).notNull(),
  unitPriceKes: integer("unit_price_kes").notNull(),
  quantity: integer("quantity").notNull(),
});

export const issuedTickets = pgTable(
  "issued_tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: varchar("order_id", { length: 32 })
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    orderItemId: uuid("order_item_id")
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    ticketCode: varchar("ticket_code", { length: 64 }).notNull(),
    qrPayload: text("qr_payload").notNull(),
    seatLabel: varchar("seat_label", { length: 32 }),
    status: varchar("status", { length: 32 }).notNull().default("valid"),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("issued_tickets_code_uidx").on(t.ticketCode)],
);

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  orderId: varchar("order_id", { length: 32 }),
  message: text("message").notNull(),
  ticketId: varchar("ticket_id", { length: 32 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Checkout inventory reservations (replaces Redis holds). */
export const inventoryHolds = pgTable(
  "inventory_holds",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    ticketTypeId: integer("ticket_type_id")
      .notNull()
      .references(() => ticketTypes.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("inventory_holds_ticket_idx").on(t.ticketTypeId),
    index("inventory_holds_expires_idx").on(t.expiresAt),
  ],
);

export type User = typeof users.$inferSelect;
export type Event = typeof events.$inferSelect;
export type TicketType = typeof ticketTypes.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type IssuedTicket = typeof issuedTickets.$inferSelect;
