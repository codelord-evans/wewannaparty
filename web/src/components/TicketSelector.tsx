import { useMemo, useState } from "react";
import type { Ticket } from "../../../../packages/shared/src/types.ts";

interface Props {
  tickets: Ticket[];
  eventSlug: string;
  ctaLabel?: string;
  ctaHref?: string;
}

function formatKes(amount: number) {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export default function TicketSelector({
  tickets,
  eventSlug,
  ctaLabel = "BUY YOUR SPOT",
  ctaHref,
}: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(
    () => tickets.find((t) => t.available && t.highlighted)?.id ?? tickets.find((t) => t.available)?.id ?? null,
  );
  const [qty, setQty] = useState(1);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    );
  }, [tickets, query]);

  const selected = tickets.find((t) => t.id === selectedId);
  const href =
    ctaHref ??
    (selected
      ? `/event/${eventSlug}/spots?ticket=${selected.id}&qty=${qty}`
      : `/event/${eventSlug}/spots`);

  return (
    <aside className="flex h-full max-h-[calc(100vh-5rem)] flex-col overflow-hidden rounded-xl border border-wwp-border bg-wwp-card lg:sticky lg:top-20">
      <div className="border-b border-wwp-border p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
            Select Tickets
          </h2>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tickets…"
          className="mt-3 w-full rounded-lg border border-wwp-border bg-wwp-surface px-3 py-2 text-sm text-white outline-none placeholder:text-wwp-muted focus:border-wwp-red/60"
        />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {filtered.map((ticket) => {
          const isSelected = selectedId === ticket.id;
          const soldOut = !ticket.available;
          return (
            <button
              key={ticket.id}
              type="button"
              disabled={soldOut}
              onClick={() => {
                setSelectedId(ticket.id);
                setQty(1);
              }}
              className={[
                "w-full rounded-xl border p-3.5 text-left transition",
                soldOut
                  ? "cursor-not-allowed border-wwp-border/60 bg-wwp-surface/40 opacity-55"
                  : isSelected || ticket.highlighted
                    ? "border-wwp-red bg-wwp-red/5 shadow-[0_0_0_1px_rgba(227,28,37,0.25)]"
                    : "border-wwp-border bg-wwp-surface hover:border-white/20",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-sm font-bold tracking-wide text-white uppercase">{ticket.name}</h3>
                    {ticket.badge === "few_left" && ticket.available && (
                      <span className="rounded-full bg-wwp-gold/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-wwp-gold uppercase">
                        Few Left
                      </span>
                    )}
                    {(ticket.badge === "popular" || ticket.highlighted) && ticket.available && (
                      <span className="rounded-full bg-wwp-red/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-wwp-red uppercase">
                        Popular
                      </span>
                    )}
                    {ticket.highlighted && ticket.available && ticket.badge !== "few_left" && (
                      <span className="rounded-full bg-wwp-gold/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-wwp-gold uppercase">
                        Few Left
                      </span>
                    )}
                  </div>
                  {ticket.description ? (
                    <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-wwp-muted">
                      {ticket.description}
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  {soldOut ? (
                    <span className="rounded bg-wwp-red px-2 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
                      Sold Out
                    </span>
                  ) : (
                    <p className="text-base font-bold text-wwp-red">{formatKes(ticket.price_kes)}</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="border-t border-wwp-border p-4">
        {selected?.available && (
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-wwp-muted">Quantity</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-wwp-border text-white hover:bg-white/5"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-semibold">{qty}</span>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-wwp-border text-white hover:bg-white/5"
                onClick={() => setQty((q) => Math.min(10, q + 1))}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        )}
        <a
          href={selected?.available ? href : undefined}
          aria-disabled={!selected?.available}
          className={[
            "flex w-full items-center justify-center rounded-lg px-4 py-3.5 text-sm font-bold tracking-wide text-white uppercase transition",
            selected?.available
              ? "bg-wwp-red hover:bg-wwp-red-dark"
              : "pointer-events-none cursor-not-allowed bg-wwp-border text-white/40",
          ].join(" ")}
        >
          {ctaLabel}
        </a>
        <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-wwp-muted">
          <a href="/terms" className="hover:text-white">
            Terms
          </a>
          <a href="/support" className="hover:text-white">
            Support
          </a>
          <a href="/support" className="hover:text-white">
            Help
          </a>
          <a href="/privacy" className="hover:text-white">
            Privacy
          </a>
        </div>
        <p className="mt-3 text-center text-[10px] text-white/30">
          Protected by military-grade encryption & security.
        </p>
      </div>
    </aside>
  );
}
