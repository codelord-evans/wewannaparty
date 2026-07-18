import { customAlphabet } from "nanoid";
import { and, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client.ts";
import {
  artists,
  events,
  galleryItems,
  issuedTickets,
  orderItems,
  orders,
  ticketTypes,
} from "../db/schema.ts";
import type { Env } from "../config.ts";
import type { RedisClient } from "../redis/client.ts";
import { releaseHold, reserveInventory } from "../redis/client.ts";

const orderId = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);
const ticketCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);

export function formatKes(amount: number) {
  return `KES ${Number(amount).toLocaleString()}`;
}

export async function getEventBySlug(db: Db, slug: string) {
  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!event) return null;

  const tickets = await db.select().from(ticketTypes).where(eq(ticketTypes.eventId, event.id));
  const eventArtists = await db.select().from(artists).where(eq(artists.eventId, event.id));

  return {
    id: event.id,
    name: event.name,
    slug: event.slug,
    description: event.description,
    poster: event.poster,
    date: event.date,
    start_time: event.startTime,
    end_time: event.endTime,
    doors_open: event.doorsOpen,
    venue_name: event.venueName,
    location: event.location,
    category: event.category,
    dress_code: event.dressCode,
    refund_policy: event.refundPolicy,
    age_restriction: event.ageRestriction,
    event_type: event.eventType,
    service_fee_kes: event.serviceFeeKes,
    parking: event.parking,
    organizer: event.organizer,
    tickets: tickets.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      price_kes: t.priceKes,
      available: t.available && t.soldCount < t.capacity,
      highlighted: t.highlighted,
      badge: t.badge as "few_left" | "popular" | null,
      capacity: t.capacity,
      sold_count: t.soldCount,
      remaining: Math.max(0, t.capacity - t.soldCount),
    })),
    artists: eventArtists.map((a) => ({
      id: a.id,
      name: a.name,
      genre: a.genre,
      instagram_url: a.instagramUrl ?? "",
      photo_url: a.photoUrl,
    })),
  };
}

export async function listFeaturedEvents(db: Db) {
  const rows = await db.select().from(events).where(eq(events.status, "approved"));
  const results = [];
  for (const e of rows) {
    const tickets = await db.select().from(ticketTypes).where(eq(ticketTypes.eventId, e.id));
    const prices = tickets.map((t) => t.priceKes);
    results.push({
      id: e.id,
      name: e.name,
      slug: e.slug,
      poster: e.poster,
      venue_name: e.venueName,
      location: e.location,
      date: e.date,
      start_time: e.startTime,
      status: e.status,
      price_min: String(prices.length ? Math.min(...prices) : 0),
      price_max: String(prices.length ? Math.max(...prices) : 0),
      ticket_badge: "available",
    });
  }
  return results;
}

export async function listGallery(db: Db) {
  const rows = await db.select().from(galleryItems);
  return rows.map((g) => ({
    id: g.id,
    type: g.type,
    title: g.title,
    venue: g.venue,
    event_date: g.eventDate,
    image_url: g.imageUrl,
    video_url: g.videoUrl,
    thumbnail_url: g.thumbnailUrl,
  }));
}

type CreateOrderInput = {
  eventSlug: string;
  items: { ticketId: number; quantity: number }[];
  email: string;
  phone: string;
  fullName: string;
  paymentMethod: "mpesa" | "card";
  idempotencyKey?: string;
  spots?: string[];
  userId?: string;
};

export async function createOrder(
  db: Db,
  redis: RedisClient,
  env: Env,
  input: CreateOrderInput,
) {
  if (input.idempotencyKey) {
    const [existing] = await db
      .select()
      .from(orders)
      .where(eq(orders.idempotencyKey, input.idempotencyKey))
      .limit(1);
    if (existing) {
      return { order: existing, replayed: true as const };
    }
  }

  const event = await getEventBySlug(db, input.eventSlug);
  if (!event) throw Object.assign(new Error("Event not found"), { status: 404 });

  const holdToken = crypto.randomUUID();
  const holdParts: string[] = [];
  let subtotal = 0;
  const lineItems: {
    ticketTypeId: number;
    ticketName: string;
    unitPriceKes: number;
    quantity: number;
  }[] = [];

  try {
    for (const item of input.items) {
      const ticket = event.tickets.find((t) => t.id === item.ticketId);
      if (!ticket || !ticket.available) {
        throw Object.assign(new Error(`Ticket ${item.ticketId} unavailable`), { status: 400 });
      }
      const partId = `${holdToken}:${ticket.id}`;
      const reserved = await reserveInventory(
        redis,
        ticket.id,
        item.quantity,
        ticket.capacity,
        ticket.sold_count,
        env.INVENTORY_HOLD_TTL_SEC,
        partId,
      );
      if (!reserved.ok) {
        throw Object.assign(
          new Error(`Not enough inventory for ${ticket.name}. Remaining: ${reserved.remaining}`),
          { status: 409 },
        );
      }
      holdParts.push(partId);
      subtotal += ticket.price_kes * item.quantity;
      lineItems.push({
        ticketTypeId: ticket.id,
        ticketName: ticket.name,
        unitPriceKes: ticket.price_kes,
        quantity: item.quantity,
      });
    }

    const qtyTotal = input.items.reduce((n, i) => n + i.quantity, 0);
    const serviceFee = event.service_fee_kes * qtyTotal;
    const id = `WWP-${orderId()}`;
    const paystackReference = `wwp_${id.toLowerCase()}_${Date.now()}`;

    const [order] = await db
      .insert(orders)
      .values({
        id,
        userId: input.userId,
        eventId: event.id,
        eventSlug: event.slug,
        email: input.email.toLowerCase(),
        phone: input.phone,
        fullName: input.fullName,
        paymentMethod: input.paymentMethod,
        status: "awaiting_payment",
        subtotalKes: subtotal,
        serviceFeeKes: serviceFee,
        totalKes: subtotal + serviceFee,
        paystackReference,
        idempotencyKey: input.idempotencyKey,
        holdToken,
        metadata: { spots: input.spots ?? [], holdParts },
      })
      .returning();

    await db.insert(orderItems).values(
      lineItems.map((li) => ({
        orderId: id,
        ticketTypeId: li.ticketTypeId,
        ticketName: li.ticketName,
        unitPriceKes: li.unitPriceKes,
        quantity: li.quantity,
      })),
    );

    return { order, replayed: false as const, event };
  } catch (err) {
    await Promise.all(holdParts.map((h) => releaseHold(redis, h)));
    throw err;
  }
}

export async function markOrderPaid(db: Db, redis: RedisClient, orderIdValue: string) {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, orderIdValue))
      .limit(1);
    if (!order) throw Object.assign(new Error("Order not found"), { status: 404 });
    if (order.status === "paid") {
      const tickets = await tx.select().from(issuedTickets).where(eq(issuedTickets.orderId, order.id));
      return { order, tickets, alreadyPaid: true as const };
    }

    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));

    for (const item of items) {
      const [updated] = await tx
        .update(ticketTypes)
        .set({ soldCount: sql`${ticketTypes.soldCount} + ${item.quantity}` })
        .where(
          and(
            eq(ticketTypes.id, item.ticketTypeId),
            sql`${ticketTypes.soldCount} + ${item.quantity} <= ${ticketTypes.capacity}`,
          ),
        )
        .returning();
      if (!updated) {
        throw Object.assign(new Error("Inventory conflict during finalize"), { status: 409 });
      }
    }

    const [paid] = await tx
      .update(orders)
      .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
      .where(eq(orders.id, order.id))
      .returning();

    const spots = (order.metadata as { spots?: string[]; holdParts?: string[] })?.spots ?? [];
    const holdParts = (order.metadata as { holdParts?: string[] })?.holdParts ?? [];

    const issued = [];
    let spotIdx = 0;
    for (const item of items) {
      for (let i = 0; i < item.quantity; i++) {
        const code = `WWP-T-${ticketCode()}`;
        const payload = JSON.stringify({
          code,
          orderId: order.id,
          eventSlug: order.eventSlug,
          ticketTypeId: item.ticketTypeId,
          email: order.email,
        });
        const [row] = await tx
          .insert(issuedTickets)
          .values({
            orderId: order.id,
            orderItemId: item.id,
            ticketCode: code,
            qrPayload: payload,
            seatLabel: spots[spotIdx++] ?? null,
          })
          .returning();
        issued.push(row);
      }
    }

    for (const h of holdParts) {
      await releaseHold(redis, h);
    }

    return { order: paid, tickets: issued, alreadyPaid: false as const };
  });
}

export async function getOrderBundle(db: Db, orderIdValue: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderIdValue)).limit(1);
  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const tickets = await db.select().from(issuedTickets).where(eq(issuedTickets.orderId, order.id));
  const [event] = await db.select().from(events).where(eq(events.id, order.eventId)).limit(1);

  const itemById = new Map(items.map((i) => [i.id, i]));
  const enrichedTickets = tickets.map((t, index) => {
    const item = itemById.get(t.orderItemId);
    return {
      ...t,
      ticketName: item?.ticketName ?? "TICKET",
      index: index + 1,
      total: tickets.length,
    };
  });

  return { order, items, tickets: enrichedTickets, event };
}
