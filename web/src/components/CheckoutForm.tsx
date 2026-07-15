import { useEffect, useMemo, useState, type FormEvent } from "react";
import { API_URL, formatKes } from "../lib/format";
import type { Ticket } from "../../../../packages/shared/src/types.ts";

interface Props {
  eventSlug: string;
  eventName: string;
  tickets: Ticket[];
  serviceFee: number;
  initialTicketId?: number;
  initialQty?: number;
}

type PayMethod = "mpesa" | "card";

export default function CheckoutForm({
  eventSlug,
  eventName,
  tickets,
  serviceFee,
  initialTicketId,
  initialQty = 1,
}: Props) {
  const available = useMemo(() => tickets.filter((t) => t.available), [tickets]);
  const [ticketId, setTicketId] = useState(
    initialTicketId && available.some((t) => t.id === initialTicketId)
      ? initialTicketId
      : available[0]?.id,
  );
  const [qty, setQty] = useState(initialQty);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<PayMethod>("mpesa");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = Number(params.get("ticket") ?? "");
    const q = Number(params.get("qty") ?? "");
    if (t && available.some((ticket) => ticket.id === t)) setTicketId(t);
    if (q >= 1 && q <= 10) setQty(q);
  }, [available]);

  const ticket = available.find((t) => t.id === ticketId);
  const totals = useMemo(() => {
    const subtotal = (ticket?.price_kes ?? 0) * qty;
    const fee = serviceFee * qty;
    return { subtotal, fee, total: subtotal + fee };
  }, [ticket, qty, serviceFee]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ticket) return;
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug,
          items: [{ ticketId: ticket.id, quantity: qty }],
          email,
          phone,
          fullName,
          paymentMethod: method,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      setStatus(data.payment.message);
      await fetch(`${API_URL}/api/orders/${data.order.id}/confirm`, { method: "POST" });
      window.location.href = `/success/${eventSlug}?order=${data.order.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <section className="card-surface p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Your details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs text-wwp-muted">Full name</span>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-wwp-border bg-wwp-surface px-3 py-2.5 text-sm outline-none focus:border-wwp-red/60"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-wwp-muted">Email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-wwp-border bg-wwp-surface px-3 py-2.5 text-sm outline-none focus:border-wwp-red/60"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-wwp-muted">M-Pesa / Phone</span>
              <input
                required
                type="tel"
                placeholder="07XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-wwp-border bg-wwp-surface px-3 py-2.5 text-sm outline-none focus:border-wwp-red/60"
              />
            </label>
          </div>
        </section>

        <section className="card-surface p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Ticket</h2>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs text-wwp-muted">Category</span>
              <select
                value={ticketId}
                onChange={(e) => setTicketId(Number(e.target.value))}
                className="w-full rounded-lg border border-wwp-border bg-wwp-surface px-3 py-2.5 text-sm outline-none focus:border-wwp-red/60"
              >
                {available.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {formatKes(t.price_kes)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block max-w-[140px]">
              <span className="mb-1.5 block text-xs text-wwp-muted">Quantity</span>
              <input
                type="number"
                min={1}
                max={10}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full rounded-lg border border-wwp-border bg-wwp-surface px-3 py-2.5 text-sm outline-none focus:border-wwp-red/60"
              />
            </label>
          </div>
        </section>

        <section className="card-surface p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Payment</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["mpesa", "M-Pesa STK"],
                ["card", "Card (Paystack)"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMethod(id)}
                className={[
                  "rounded-lg border px-4 py-3 text-left text-sm font-medium transition",
                  method === id
                    ? "border-wwp-red bg-wwp-red/10 text-white"
                    : "border-wwp-border bg-wwp-surface text-white/70 hover:border-white/20",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      </div>

      <aside className="card-surface h-fit p-5 lg:sticky lg:top-24">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Order summary</h2>
        <p className="mt-1 text-sm text-wwp-muted">{eventName}</p>
        <div className="mt-5 space-y-2 border-t border-wwp-border pt-4 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-wwp-muted">
              {ticket?.name} × {qty}
            </span>
            <span>{formatKes(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-wwp-muted">Service fee</span>
            <span>{formatKes(totals.fee)}</span>
          </div>
          <div className="flex justify-between gap-3 border-t border-wwp-border pt-3 text-base font-bold">
            <span>Total</span>
            <span className="text-wwp-red">{formatKes(totals.total)}</span>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-wwp-red">{error}</p>}
        {status && <p className="mt-4 text-sm text-green-400">{status}</p>}

        <button
          type="submit"
          disabled={loading || !ticket}
          className="mt-5 w-full rounded-lg bg-wwp-red px-4 py-3.5 text-sm font-bold tracking-wide text-white uppercase transition hover:bg-wwp-red-dark disabled:opacity-50"
        >
          {loading ? "Processing…" : "Complete payment"}
        </button>
        <p className="mt-3 text-center text-[11px] text-white/35">
          Demo checkout — payments are mocked via the Bun API.
        </p>
      </aside>
    </form>
  );
}
