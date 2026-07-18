import { loadEnv } from "../config.ts";
import { createDb } from "./client.ts";
import { artists, events, galleryItems, ticketTypes } from "./schema.ts";
import { werAfro, featuredEvents, galleryItems as seedGallery } from "../../../packages/shared/src/data.ts";
import { eq } from "drizzle-orm";

const env = loadEnv();
const { db, client } = createDb(env);

async function seed() {
  const [existing] = await db.select().from(events).where(eq(events.slug, werAfro.slug)).limit(1);
  if (existing) {
    await db
      .update(events)
      .set({
        name: werAfro.name,
        date: werAfro.date,
        startTime: werAfro.start_time,
        endTime: werAfro.end_time,
        doorsOpen: werAfro.doors_open,
        venueName: werAfro.venue_name,
        location: werAfro.location,
      })
      .where(eq(events.slug, werAfro.slug));
    console.log("Seed skipped insert — synced wer-afro event fields");
    await client.end();
    return;
  }

  const [event] = await db
    .insert(events)
    .values({
      id: werAfro.id,
      name: werAfro.name,
      slug: werAfro.slug,
      description: werAfro.description,
      poster: werAfro.poster,
      date: werAfro.date,
      startTime: werAfro.start_time,
      endTime: werAfro.end_time,
      doorsOpen: werAfro.doors_open,
      venueName: werAfro.venue_name,
      location: werAfro.location,
      category: werAfro.category,
      dressCode: werAfro.dress_code,
      refundPolicy: werAfro.refund_policy,
      ageRestriction: werAfro.age_restriction,
      eventType: werAfro.event_type,
      serviceFeeKes: werAfro.service_fee_kes,
      parking: werAfro.parking,
      organizer: werAfro.organizer,
      status: "approved",
    })
    .returning();

  for (const t of werAfro.tickets) {
    // Keep DB `available` aligned with API: available && soldCount < capacity
    const capacity = 500;
    const soldCount = t.available ? 0 : capacity;
    await db.insert(ticketTypes).values({
      id: t.id,
      eventId: event.id,
      name: t.name,
      description: t.description,
      priceKes: t.price_kes,
      capacity,
      soldCount,
      available: soldCount < capacity,
      highlighted: t.highlighted,
      badge: t.badge ?? null,
    });
  }

  for (const a of werAfro.artists) {
    await db.insert(artists).values({
      id: a.id,
      eventId: event.id,
      name: a.name,
      genre: a.genre,
      instagramUrl: a.instagram_url,
      photoUrl: a.photo_url,
    });
  }

  for (const fe of featuredEvents) {
    if (fe.slug === werAfro.slug) continue;
    const [row] = await db.select().from(events).where(eq(events.slug, fe.slug)).limit(1);
    if (row) continue;
    await db.insert(events).values({
      id: fe.id,
      name: fe.name,
      slug: fe.slug,
      description: `${fe.name} at ${fe.venue_name}`,
      poster: fe.poster,
      date: fe.date,
      startTime: fe.start_time,
      endTime: "23:00:00",
      doorsOpen: "18:00:00",
      venueName: fe.venue_name,
      location: fe.location,
      category: "concert",
      dressCode: "Smart Casual",
      refundPolicy: "Non Refundable",
      ageRestriction: "18+",
      status: fe.status,
    });
  }

  for (const g of seedGallery) {
    await db.insert(galleryItems).values({
      id: g.id,
      type: g.type,
      title: g.title,
      venue: g.venue,
      eventDate: g.event_date,
      imageUrl: g.image_url,
      videoUrl: g.video_url,
      thumbnailUrl: g.thumbnail_url,
    });
  }

  // Reset serial sequences after explicit IDs
  await client`SELECT setval(pg_get_serial_sequence('events', 'id'), (SELECT COALESCE(MAX(id), 1) FROM events))`;
  await client`SELECT setval(pg_get_serial_sequence('ticket_types', 'id'), (SELECT COALESCE(MAX(id), 1) FROM ticket_types))`;
  await client`SELECT setval(pg_get_serial_sequence('artists', 'id'), (SELECT COALESCE(MAX(id), 1) FROM artists))`;
  await client`SELECT setval(pg_get_serial_sequence('gallery_items', 'id'), (SELECT COALESCE(MAX(id), 1) FROM gallery_items))`;

  console.log("Seed complete");
  await client.end();
}

await seed();
