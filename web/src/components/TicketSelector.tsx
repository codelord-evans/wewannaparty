import { useMemo, useState } from "react";
import type { Ticket } from "../../../../packages/shared/src/types.ts";

interface Props {
  tickets: Ticket[];
  eventSlug: string;
  /** Ticket IDs that route to the seat/spot picker instead of checkout */
  spotTicketIds?: number[];
}

function formatKes(amount: number) {
  return `KES ${Number(amount).toLocaleString()}`;
}

export default function TicketSelector({
  tickets,
  eventSlug,
  spotTicketIds = [],
}: Props) {
  const spotSet = useMemo(() => new Set(spotTicketIds), [spotTicketIds]);
  const [selectedId, setSelectedId] = useState<number | null>(
    () =>
      tickets.find((t) => t.available && t.highlighted)?.id ??
      tickets.find((t) => t.available)?.id ??
      null,
  );

  const allSoldOut = tickets.length > 0 && tickets.every((t) => !t.available);
  const selected = tickets.find((t) => t.id === selectedId);
  const needsSpot = selectedId != null && spotSet.has(selectedId);

  const ctaHref =
    selected?.available && selectedId
      ? needsSpot
        ? `/event/${eventSlug}/spots?plan=${selectedId}`
        : `/checkout/${eventSlug}?ticket=${selectedId}`
      : undefined;

  const ctaLabel = allSoldOut
    ? "Sold Out"
    : !selected
      ? "Select a Ticket"
      : needsSpot
        ? "Pick Your Spot"
        : "Proceed to Checkout";

  return (
    <div className="sticky top-24 space-y-4">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold text-foreground">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary"
            aria-hidden
          >
            <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9z" />
            <path d="M13 5v2M13 17v2" />
          </svg>
          Select Tickets
        </h2>

        {allSoldOut && (
          <div className="mb-4 rounded-xl border border-border bg-muted/20 p-4">
            <div className="text-sm font-bold text-foreground">SOLD OUT</div>
            <div className="mt-1 text-xs text-muted-foreground">
              All ticket categories for this event have been sold out.
            </div>
          </div>
        )}

        {tickets.length ? (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const soldOut = !ticket.available || allSoldOut;
              const isSelected = selectedId === ticket.id;
              return (
                <button
                  key={ticket.id}
                  type="button"
                  disabled={soldOut}
                  onClick={() => ticket.available && setSelectedId(ticket.id)}
                  className={[
                    "w-full rounded-xl border-2 p-4 text-left transition-all",
                    soldOut
                      ? "cursor-not-allowed border-border bg-muted/20 opacity-50"
                      : isSelected
                        ? "border-primary bg-primary/10"
                        : ticket.highlighted
                          ? "border-primary/50 bg-primary/5 hover:border-primary"
                          : "border-border hover:border-primary/50",
                  ].join(" ")}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground">{ticket.name}</span>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                      {soldOut && (
                        <span className="rounded-full bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">
                          SOLD OUT
                        </span>
                      )}
                      {ticket.highlighted && ticket.available && (
                        <span className="rounded-full bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
                          POPULAR
                        </span>
                      )}
                      {spotSet.has(ticket.id) && ticket.available && (
                        <span className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-1 text-xs font-bold text-amber-500">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.8 5.6 21.2 8 14 2 9.2h7.6L12 2z" />
                          </svg>
                          PICK YOUR SPOT
                        </span>
                      )}
                    </div>
                  </div>
                  {ticket.description ? (
                    <div className="mb-2 whitespace-pre-line text-sm text-muted-foreground">
                      {ticket.description}
                    </div>
                  ) : null}
                  <div className="text-lg font-bold text-primary">{formatKes(ticket.price_kes)}</div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Tickets for this event are not available yet.</p>
        )}

        <a
          href={ctaHref}
          aria-disabled={!ctaHref}
          className={[
            "mt-6 flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-bold text-primary-foreground transition",
            ctaHref
              ? "bg-primary hover:bg-primary/90"
              : "pointer-events-none cursor-not-allowed bg-muted text-muted-foreground",
          ].join(" ")}
        >
          {ctaLabel}
        </a>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Secure payment • Instant delivery
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card/50 p-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary"
              aria-hidden
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span>Protected by military-grade encryption & security.</span>
        </div>
      </div>
    </div>
  );
}
