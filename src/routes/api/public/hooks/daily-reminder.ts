import { createFileRoute } from "@tanstack/react-router";
import { buildPushPayload } from "@block65/webcrypto-web-push";

type Row = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  reminder_time: string;
  tz_offset_minutes: number;
  last_sent_on: string | null;
};

function localParts(offsetMinutes: number) {
  const local = new Date(Date.now() + offsetMinutes * 60 * 1000);
  const date = local.toISOString().slice(0, 10);
  const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
  return { date, minutes };
}

function timeToMinutes(time: string) {
  const [h, m] = time.slice(0, 5).split(":");
  return (Number(h) || 0) * 60 + (Number(m) || 0);
}

export const Route = createFileRoute("/api/public/hooks/daily-reminder")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        const allowed = [
          process.env["SUPABASE_ANON_KEY"],
          process.env["SUPABASE_PUBLISHABLE_KEY"],
        ].filter(Boolean);
        if (!apikey || !allowed.includes(apikey)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const vapid = {
          subject: process.env["VAPID_SUBJECT"],
          publicKey: process.env["VAPID_PUBLIC_KEY"],
          privateKey: process.env["VAPID_PRIVATE_KEY"],
        };
        if (!vapid.publicKey || !vapid.privateKey) {
          return new Response("Push not configured", { status: 500 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("push_subscriptions")
          .select("id, endpoint, p256dh, auth, reminder_time, tz_offset_minutes, last_sent_on")
          .eq("enabled", true);
        if (error) return new Response(error.message, { status: 500 });

        let sent = 0;
        for (const row of (data ?? []) as Row[]) {
          const { date, minutes } = localParts(row.tz_offset_minutes);
          if (row.last_sent_on === date) continue;
          if (minutes < timeToMinutes(row.reminder_time)) continue;

          try {
            const payload = await buildPushPayload(
              {
                data: {
                  title: "Cube — log today's spending",
                  body: "A minute now keeps your budget honest. Add today's expenses.",
                  url: "/dashboard",
                },
                options: { urgency: "normal", ttl: 3600 },
              },
              {
                endpoint: row.endpoint,
                expirationTime: null,
                keys: { p256dh: row.p256dh, auth: row.auth },
              },
              vapid,
            );

            const headers = Object.fromEntries(
              Object.entries(payload.headers).filter(([, v]) => typeof v === "string"),
            ) as Record<string, string>;

            const res = await fetch(row.endpoint, {
              method: payload.method,
              headers,
              body: payload.body as unknown as BodyInit,
            });

            if (res.status === 404 || res.status === 410) {
              await supabaseAdmin.from("push_subscriptions").delete().eq("id", row.id);
              continue;
            }
            await supabaseAdmin
              .from("push_subscriptions")
              .update({ last_sent_on: date })
              .eq("id", row.id);
            sent += 1;
          } catch {
            /* skip this device and continue with the rest */
          }
        }

        return Response.json({ ok: true, sent });
      },
    },
  },
});
