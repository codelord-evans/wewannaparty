import { and, eq, gt, sql } from "drizzle-orm";
import type { Db } from "../db/client.ts";
import { inventoryHolds, ticketTypes } from "../db/schema.ts";

/** Reserve ticket qty until expiresAt. Uses row lock + holds table (no Redis). */
export async function reserveInventory(
  db: Db,
  ticketTypeId: number,
  qty: number,
  capacity: number,
  sold: number,
  holdTtlSec: number,
  holdId: string,
) {
  return db.transaction(async (tx) => {
    await tx.delete(inventoryHolds).where(sql`${inventoryHolds.expiresAt} < now()`);

    // Serialize concurrent reservations for this ticket type
    await tx.execute(sql`select id from ticket_types where id = ${ticketTypeId} for update`);

    const [sumRow] = await tx
      .select({
        held: sql<number>`coalesce(sum(${inventoryHolds.quantity}), 0)::int`,
      })
      .from(inventoryHolds)
      .where(
        and(eq(inventoryHolds.ticketTypeId, ticketTypeId), gt(inventoryHolds.expiresAt, new Date())),
      );

    const held = Number(sumRow?.held ?? 0);
    const remaining = capacity - sold - held;
    if (remaining < qty) {
      return { ok: false as const, remaining };
    }

    await tx.insert(inventoryHolds).values({
      id: holdId,
      ticketTypeId,
      quantity: qty,
      expiresAt: new Date(Date.now() + holdTtlSec * 1000),
    });

    return { ok: true as const, remaining: remaining - qty };
  });
}

export async function releaseHold(db: Db, holdId: string) {
  await db.delete(inventoryHolds).where(eq(inventoryHolds.id, holdId));
  return true;
}

export async function releaseHolds(db: Db, holdIds: string[]) {
  if (!holdIds.length) return;
  await Promise.all(holdIds.map((id) => releaseHold(db, id)));
}

export async function heldQuantity(db: Db, ticketTypeId: number) {
  await db.delete(inventoryHolds).where(sql`${inventoryHolds.expiresAt} < now()`);
  const [sumRow] = await db
    .select({
      held: sql<number>`coalesce(sum(${inventoryHolds.quantity}), 0)::int`,
    })
    .from(inventoryHolds)
    .where(
      and(eq(inventoryHolds.ticketTypeId, ticketTypeId), gt(inventoryHolds.expiresAt, new Date())),
    );
  return Number(sumRow?.held ?? 0);
}

/** Optional: refresh soldCount from DB (used when locking). */
export async function getTicketSold(db: Db, ticketTypeId: number) {
  const [row] = await db
    .select({ soldCount: ticketTypes.soldCount })
    .from(ticketTypes)
    .where(eq(ticketTypes.id, ticketTypeId))
    .limit(1);
  return row?.soldCount ?? 0;
}
