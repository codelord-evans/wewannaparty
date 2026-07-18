import type { Env } from "../config.ts";
import type { Db } from "../db/client.ts";
import { eq } from "drizzle-orm";
import { orders } from "../db/schema.ts";
import { getOrderBundle } from "./catalog.ts";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function qrImageUrl(payload: string) {
  const params = new URLSearchParams({
    size: "220x220",
    data: payload,
    color: "B30000",
    bgcolor: "FFFFFF",
    qzone: "1",
    format: "png",
    margin: "0",
  });
  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

function typeBadgeLabel(name: string) {
  const trimmed = name.trim();
  if (trimmed.length <= 18) return trimmed.toUpperCase();
  return trimmed.split(/\s+/)[0]?.toUpperCase() || "TICKET";
}

function renderTicketEmailHtml(input: {
  fullName: string;
  displayRef: string;
  eventName: string;
  date: string;
  startTime: string;
  doorsOpen: string;
  venueName: string;
  location: string;
  ticketUrl: string;
  tickets: Array<{
    ticketCode: string;
    qrPayload: string;
    ticketName: string;
    index: number;
    total: number;
  }>;
}) {
  const ticketBlocks = input.tickets
    .map((ticket) => {
      const qr = qrImageUrl(ticket.qrPayload);
      return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;background:#000000;border-radius:16px;">
        <tr>
          <td style="padding:36px 24px 28px 24px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:13px;font-weight:800;letter-spacing:4px;color:#ffffff;text-transform:uppercase;">WEWANNAPARTY</div>
            <div style="margin-top:10px;font-size:10px;letter-spacing:3px;color:#777777;text-transform:uppercase;">Electronic Ticket</div>
            <div style="margin-top:22px;font-size:26px;font-weight:700;color:#ffffff;line-height:1.15;">${escapeHtml(input.eventName)}</div>
            <div style="margin-top:16px;">
              <span style="display:inline-block;padding:6px 14px;border:1px solid #8B0000;border-radius:999px;background:rgba(179,0,0,0.25);color:#ff3b3b;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${escapeHtml(typeBadgeLabel(ticket.ticketName))}</span>
            </div>
            <div style="margin-top:10px;font-size:10px;letter-spacing:2px;color:#666666;text-transform:uppercase;">Ticket ${ticket.index} of ${ticket.total}</div>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:#121212;border:1px solid #222222;border-radius:14px;text-align:left;">
              <tr>
                <td width="50%" style="padding:14px 16px;border-right:1px solid #222222;vertical-align:top;">
                  <div style="font-size:10px;letter-spacing:2px;color:#666666;text-transform:uppercase;">Date</div>
                  <div style="margin-top:6px;font-size:14px;font-weight:700;color:#ffffff;">${escapeHtml(input.date)}</div>
                </td>
                <td width="50%" style="padding:14px 16px;vertical-align:top;">
                  <div style="font-size:10px;letter-spacing:2px;color:#666666;text-transform:uppercase;">Time</div>
                  <div style="margin-top:6px;font-size:14px;font-weight:700;color:#ffffff;">${escapeHtml(input.startTime)}</div>
                  <div style="margin-top:4px;font-size:12px;color:#777777;">Doors: ${escapeHtml(input.doorsOpen)}</div>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding:14px 16px;border-top:1px solid #222222;">
                  <div style="font-size:10px;letter-spacing:2px;color:#666666;text-transform:uppercase;">Venue</div>
                  <div style="margin-top:6px;font-size:14px;font-weight:700;color:#ffffff;">${escapeHtml(input.venueName)}</div>
                  <div style="margin-top:4px;font-size:12px;color:#777777;">${escapeHtml(input.location)}</div>
                </td>
              </tr>
            </table>

            <div style="margin-top:28px;font-size:10px;letter-spacing:3px;color:#666666;text-transform:uppercase;">Scan to enter</div>
            <div style="margin-top:12px;">
              <img src="${qr}" width="220" height="220" alt="Ticket QR ${escapeHtml(ticket.ticketCode)}" style="display:inline-block;border-radius:14px;background:#ffffff;padding:12px;" />
            </div>
            <div style="margin-top:16px;font-family:Consolas,Monaco,monospace;font-size:15px;font-weight:700;color:#E60000;letter-spacing:1px;">${escapeHtml(ticket.ticketCode)}</div>
            <div style="margin-top:8px;font-size:12px;color:#777777;">Present this QR at the gate · One scan per person</div>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:#121212;border:1px solid rgba(179,0,0,0.35);border-radius:14px;text-align:left;">
              <tr>
                <td width="50%" style="padding:14px 16px;vertical-align:top;">
                  <div style="font-size:10px;letter-spacing:2px;color:#666666;text-transform:uppercase;">Ticket holder</div>
                  <div style="margin-top:6px;font-size:14px;font-weight:700;color:#ffffff;">${escapeHtml(input.fullName)}</div>
                </td>
                <td width="50%" style="padding:14px 16px;vertical-align:top;">
                  <div style="font-size:10px;letter-spacing:2px;color:#666666;text-transform:uppercase;">Order ref</div>
                  <div style="margin-top:6px;font-family:Consolas,Monaco,monospace;font-size:14px;font-weight:700;color:#E60000;">${escapeHtml(input.displayRef)}</div>
                </td>
              </tr>
            </table>

            <div style="margin-top:18px;font-size:11px;color:#555555;">Non-transferable · Valid ID may be required at entry</div>
          </td>
        </tr>
      </table>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#000000;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000000;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;">
            <tr>
              <td style="padding:8px 8px 20px 8px;text-align:center;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
                <div style="font-size:18px;font-weight:700;">Your tickets are ready</div>
                <div style="margin-top:8px;font-size:13px;color:#aaaaaa;line-height:1.5;">
                  Hi ${escapeHtml(input.fullName)}, thanks for booking ${escapeHtml(input.eventName)}.
                  Show the QR below at the gate, or open your tickets online.
                </div>
                <div style="margin-top:18px;">
                  <a href="${escapeHtml(input.ticketUrl)}" style="display:inline-block;background:#B30000;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:12px 18px;border-radius:8px;">
                    View tickets online
                  </a>
                </div>
              </td>
            </tr>
            <tr><td>${ticketBlocks}</td></tr>
            <tr>
              <td style="padding:8px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#555555;">
                Sent by WeWannaParty · Keep this email for entry
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendOrderTicketsEmail(env: Env, db: Db, orderId: string) {
  if (!env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping ticket email");
    return { sent: false as const, reason: "not_configured" as const };
  }

  const bundle = await getOrderBundle(db, orderId);
  if (!bundle?.event || bundle.order.status !== "paid") {
    return { sent: false as const, reason: "not_ready" as const };
  }
  if (bundle.order.emailSentAt) {
    return { sent: false as const, reason: "already_sent" as const };
  }
  if (!bundle.tickets.length) {
    return { sent: false as const, reason: "no_tickets" as const };
  }

  const displayRef = bundle.order.id.replace(/^ORD-/, "WWP-");
  const ticketUrl = `${env.APP_URL}/success/${bundle.order.eventSlug}?order=${encodeURIComponent(bundle.order.id)}&email=${encodeURIComponent(bundle.order.email)}`;

  const html = renderTicketEmailHtml({
    fullName: bundle.order.fullName,
    displayRef,
    eventName: bundle.event.name,
    date: bundle.event.date,
    startTime: bundle.event.startTime,
    doorsOpen: bundle.event.doorsOpen,
    venueName: bundle.event.venueName,
    location: bundle.event.location,
    ticketUrl,
    tickets: bundle.tickets.map((t) => ({
      ticketCode: t.ticketCode,
      qrPayload: t.qrPayload,
      ticketName: t.ticketName,
      index: t.index,
      total: t.total,
    })),
  });

  const text = [
    `WEWANNAPARTY — Electronic Ticket`,
    `${bundle.event.name}`,
    `Order: ${displayRef}`,
    `Holder: ${bundle.order.fullName}`,
    ...bundle.tickets.map(
      (t) => `Ticket ${t.index}/${t.total}: ${t.ticketCode} (${t.ticketName})`,
    ),
    `View online: ${ticketUrl}`,
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [bundle.order.email],
      subject: `Your ticket · ${bundle.event.name}`,
      html,
      text,
      tags: [
        { name: "type", value: "ticket" },
        { name: "order_id", value: bundle.order.id.slice(0, 50) },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[email] Resend failed:", res.status, body);
    return { sent: false as const, reason: "provider_error" as const };
  }

  await db
    .update(orders)
    .set({ emailSentAt: new Date(), updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  return { sent: true as const };
}
