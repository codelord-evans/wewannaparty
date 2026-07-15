import { useEffect, useMemo, useState } from "react";

interface Props {
  eventSlug: string;
  ticketId?: number;
  qty?: number;
}

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const COLS = 12;

function seatId(row: string, col: number) {
  return `${row}${col}`;
}

export default function SpotsPicker({ eventSlug, ticketId: ticketIdProp, qty: qtyProp = 1 }: Props) {
  const [ticketId, setTicketId] = useState(ticketIdProp);
  const [qty, setQty] = useState(qtyProp);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = Number(params.get("ticket") ?? params.get("plan") ?? "");
    const q = Number(params.get("qty") ?? "");
    if (t) setTicketId(t);
    if (q >= 1 && q <= 10) setQty(q);
  }, []);

  const taken = useMemo(() => {
    const set = new Set<string>();
    for (const row of ROWS) {
      for (let c = 1; c <= COLS; c++) {
        if ((row.charCodeAt(0) + c) % 5 === 0) set.add(seatId(row, c));
      }
    }
    return set;
  }, []);

  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    if (taken.has(id)) return;
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= qty) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }

  const ready = selected.length === qty;
  const checkoutHref = ready
    ? `/checkout/${eventSlug}?ticket=${ticketId ?? ""}&qty=${qty}&spots=${selected.join(",")}`
    : undefined;

  return (
    <div className="space-y-6">
      <div className="card-surface overflow-x-auto p-4 sm:p-6">
        <div className="mx-auto mb-6 h-2 max-w-md rounded-full bg-gradient-to-r from-transparent via-wwp-red to-transparent opacity-80" />
        <p className="mb-6 text-center text-xs tracking-[0.3em] text-wwp-muted uppercase">Stage</p>

        <div className="inline-block min-w-full">
          <div className="flex flex-col items-center gap-2">
            {ROWS.map((row) => (
              <div key={row} className="flex items-center gap-1.5 sm:gap-2">
                <span className="w-4 text-center text-xs text-wwp-muted">{row}</span>
                {Array.from({ length: COLS }, (_, i) => i + 1).map((col) => {
                  const id = seatId(row, col);
                  const isTaken = taken.has(id);
                  const isSelected = selected.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={isTaken}
                      onClick={() => toggle(id)}
                      title={id}
                      className={[
                        "h-7 w-7 rounded-md text-[10px] font-semibold transition sm:h-8 sm:w-8",
                        isTaken
                          ? "cursor-not-allowed bg-white/10 text-white/20"
                          : isSelected
                            ? "bg-wwp-red text-white"
                            : "bg-wwp-surface text-white/70 ring-1 ring-wwp-border hover:ring-wwp-red/50",
                      ].join(" ")}
                    >
                      {col}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-wwp-muted">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-wwp-surface ring-1 ring-wwp-border" /> Available
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-wwp-red" /> Selected
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-white/10" /> Taken
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-wwp-muted">
          Selected {selected.length}/{qty}:{" "}
          <span className="text-white">{selected.length ? selected.join(", ") : "—"}</span>
        </p>
        <a
          href={checkoutHref}
          aria-disabled={!ready}
          className={[
            "inline-flex rounded-lg px-6 py-3 text-sm font-bold tracking-wide text-white uppercase transition",
            ready ? "bg-wwp-red hover:bg-wwp-red-dark" : "pointer-events-none bg-wwp-border text-white/40",
          ].join(" ")}
        >
          Continue to checkout
        </a>
      </div>
    </div>
  );
}
