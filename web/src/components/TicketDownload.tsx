import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../lib/format";

type TicketCard = {
  id: string;
  ticketCode: string;
  qrPayload: string;
  seatLabel: string | null;
  status: string;
  ticketName: string;
  index: number;
  total: number;
};

type OrderPayload = {
  order: {
    id: string;
    displayRef: string;
    fullName: string;
    email: string;
    status: string;
  };
  event: {
    name: string;
    date: string;
    startTime: string;
    doorsOpen: string;
    venueName: string;
    location: string;
  } | null;
  tickets: TicketCard[];
};

interface Props {
  eventSlug: string;
  eventName: string;
}

function typeBadgeLabel(name: string) {
  const trimmed = name.trim();
  if (trimmed.length <= 18) return trimmed.toUpperCase();
  return trimmed.split(/\s+/)[0]?.toUpperCase() || "TICKET";
}

function ElectronicTicket({
  ticket,
  order,
  event,
}: {
  ticket: TicketCard;
  order: OrderPayload["order"];
  event: NonNullable<OrderPayload["event"]>;
}) {
  const qrUrl = useMemo(() => {
    const params = new URLSearchParams({
      size: "240x240",
      data: ticket.qrPayload,
      color: "B30000",
      bgcolor: "FFFFFF",
      qzone: "1",
      format: "png",
      margin: "0",
    });
    return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
  }, [ticket.qrPayload]);

  return (
    <article className="relative mx-auto w-full max-w-[400px] overflow-hidden bg-black px-6 pb-10 pt-12 text-center">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,_rgba(140,0,0,0.55)_0%,_transparent_65%)]"
        aria-hidden
      />

      <div className="relative">
        <p className="font-display text-[14px] font-extrabold tracking-[0.32em] text-white uppercase">
          WeWannaParty
        </p>
        <p className="mt-2.5 text-[10px] font-normal tracking-[0.38em] text-white/40 uppercase">
          Electronic Ticket
        </p>

        <h1 className="mt-7 font-display text-[30px] leading-none font-bold tracking-tight text-white">
          {event.name}
        </h1>

        <div className="mt-5 flex flex-col items-center gap-2.5">
          <span className="inline-flex rounded-full border border-[#8B0000] bg-[#B30000]/25 px-4 py-1 text-[11px] font-bold tracking-[0.12em] text-[#ff3b3b] uppercase">
            {typeBadgeLabel(ticket.ticketName)}
          </span>
          <p className="text-[10px] font-medium tracking-[0.28em] text-white/35 uppercase">
            Ticket {ticket.index} of {ticket.total}
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121212] text-left">
          <div className="grid grid-cols-2">
            <div className="border-r border-white/[0.08] px-4 py-4">
              <p className="text-[10px] font-medium tracking-[0.22em] text-white/35 uppercase">Date</p>
              <p className="mt-1.5 text-[15px] font-bold text-white">{event.date}</p>
            </div>
            <div className="px-4 py-4">
              <p className="text-[10px] font-medium tracking-[0.22em] text-white/35 uppercase">Time</p>
              <p className="mt-1.5 text-[15px] font-bold text-white">{event.startTime}</p>
              <p className="mt-1 text-[12px] text-white/40">Doors: {event.doorsOpen}</p>
            </div>
          </div>
          <div className="border-t border-white/[0.08] px-4 py-4">
            <p className="text-[10px] font-medium tracking-[0.22em] text-white/35 uppercase">Venue</p>
            <p className="mt-1.5 text-[15px] font-bold text-white">{event.venueName}</p>
            <p className="mt-1 text-[12px] text-white/40">{event.location}</p>
          </div>
        </div>

        <div className="relative my-8">
          <div className="absolute top-1/2 -left-6 z-10 h-[22px] w-[22px] -translate-y-1/2 rounded-full bg-black" />
          <div className="absolute top-1/2 -right-6 z-10 h-[22px] w-[22px] -translate-y-1/2 rounded-full bg-black" />
          <div className="border-t border-dashed border-white/20" />
        </div>

        <p className="text-[10px] font-medium tracking-[0.32em] text-white/35 uppercase">Scan to enter</p>

        <div className="mx-auto mt-4 w-fit overflow-hidden rounded-2xl bg-white p-3.5">
          <img
            src={qrUrl}
            alt={`QR code ${ticket.ticketCode}`}
            className="block h-[220px] w-[220px]"
            width={220}
            height={220}
          />
        </div>

        <p className="mt-5 font-mono text-[15px] font-bold tracking-wide text-[#E60000]">
          {ticket.ticketCode}
        </p>
        <p className="mt-2 text-[12px] text-white/40">Present this QR at the gate · One scan per person</p>

        <div className="mt-8 rounded-2xl border border-[#B30000]/30 bg-[#121212] px-4 py-4 shadow-[0_0_28px_rgba(179,0,0,0.22)]">
          <div className="grid grid-cols-2 gap-3 text-left">
            <div>
              <p className="text-[10px] font-medium tracking-[0.22em] text-white/35 uppercase">
                Ticket holder
              </p>
              <p className="mt-1.5 text-[14px] font-bold text-white">{order.fullName}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium tracking-[0.22em] text-white/35 uppercase">
                Order ref
              </p>
              <p className="mt-1.5 font-mono text-[14px] font-bold text-[#E60000]">{order.displayRef}</p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-[11px] text-white/30">
          Non-transferable · Valid ID may be required at entry
        </p>
      </div>
    </article>
  );
}

export default function TicketDownload({ eventSlug, eventName }: Props) {
  const [data, setData] = useState<OrderPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("order");
    const email = params.get("email");
    if (!id) {
      setError("Missing order id");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        await fetch(`${API_URL}/api/orders/${id}/confirm`, { method: "POST" });
        const qs = email ? `?email=${encodeURIComponent(email)}` : "";
        const res = await fetch(`${API_URL}/api/orders/${id}${qs}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not load tickets");

        setData({
          order: {
            id: json.order.id,
            displayRef: json.order.displayRef ?? String(json.order.id),
            fullName: json.order.fullName,
            email: json.order.email,
            status: json.order.status,
          },
          event: json.event ?? {
            name: eventName,
            date: "—",
            startTime: "—",
            doorsOpen: "—",
            venueName: "—",
            location: "—",
          },
          tickets: (json.tickets ?? []).map(
            (t: Record<string, unknown>, i: number, arr: unknown[]) => ({
              id: String(t.id),
              ticketCode: String(t.ticketCode ?? t.code ?? ""),
              qrPayload: String(t.qrPayload ?? ""),
              seatLabel: (t.seatLabel as string | null) ?? null,
              status: String(t.status ?? "valid"),
              ticketName: String(t.ticketName ?? "TICKET"),
              index: Number(t.index ?? i + 1),
              total: Number(t.total ?? arr.length),
            }),
          ),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tickets");
      } finally {
        setLoading(false);
      }
    })();
  }, [eventName]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4">
        <p className="text-sm tracking-wide text-white/50 uppercase">Preparing your ticket…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-black px-4 text-center">
        <p className="text-sm text-primary">{error}</p>
        <a href={`/event/${eventSlug}`} className="text-xs text-white/50 underline">
          Back to event
        </a>
      </div>
    );
  }

  if (!data?.tickets.length || !data.event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4">
        <p className="text-sm text-white/50">
          Payment received — tickets are being issued. Refresh in a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto flex max-w-lg flex-col gap-10 py-2 sm:py-8">
        {data.tickets.map((ticket) => (
          <ElectronicTicket key={ticket.id} ticket={ticket} order={data.order} event={data.event!} />
        ))}
      </div>

      <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-3 px-4 pb-14 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-primary px-5 py-3 text-xs font-bold tracking-wide text-white uppercase hover:bg-primary/90"
        >
          Download / Print
        </button>
        <a
          href={`/event/${eventSlug}`}
          className="rounded-lg border border-white/15 px-5 py-3 text-xs font-bold tracking-wide text-white/80 uppercase hover:bg-white/5"
        >
          Back to event
        </a>
      </div>
    </div>
  );
}
