import { supabase } from "@/integrations/supabase/client";

/** VAPID public key — safe to ship to the browser. */
export const VAPID_PUBLIC_KEY =
  "BC8HjJovS6W_0tWCERcCR-GvxTM7FRtii88emaNt_AYrUVWW1ClSTeP4yq3XXoxlHgpGV-tBUv1ery-3WILRVGw";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Registers the dedicated notifications-only worker. Kept separate from the
 * offline app-shell worker (/sw.js), which is intentionally disabled in dev
 * and inside the Lovable preview.
 */
async function pushRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register("/push-sw.js", {
      scope: "/push-sw-scope/",
    });
    await navigator.serviceWorker.ready.catch(() => undefined);
    return registration;
  } catch {
    return null;
  }
}

export async function getPushRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration("/push-sw-scope/");
  return existing ?? null;
}

/**
 * Subscribes this device to push and stores the subscription so the scheduled
 * job can reach it even when the app is closed and the user is signed out.
 */
export async function enablePushReminder(time: string) {
  if (!pushSupported()) throw new Error("This browser does not support notifications");

  let permission: NotificationPermission;
  try {
    permission = await Notification.requestPermission();
  } catch {
    throw new Error("Your browser blocked the notification request");
  }
  if (permission === "denied")
    throw new Error(
      "Notifications are blocked for Cube. Allow them in your browser settings, then try again.",
    );
  if (permission !== "granted") throw new Error("Allow notifications to get a daily reminder");

  const registration = (await getPushRegistration()) ?? (await pushRegistration());
  if (!registration)
    throw new Error("This browser wouldn't start the notification service — try reloading Cube");


  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));

  const json = subscription.toJSON() as { endpoint?: string; keys?: Record<string, string> };
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: data.user.id,
      endpoint: json.endpoint ?? subscription.endpoint,
      p256dh: json.keys?.["p256dh"] ?? "",
      auth: json.keys?.["auth"] ?? "",
      reminder_time: time,
      tz_offset_minutes: -new Date().getTimezoneOffset(),
      enabled: true,
      last_sent_on: null,
    },
    { onConflict: "endpoint" },
  );
  if (error) throw error;
}

export async function updatePushReminderTime(time: string) {
  if (!pushSupported()) return;
  const registration = await getPushRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await supabase
    .from("push_subscriptions")
    .update({ reminder_time: time, tz_offset_minutes: -new Date().getTimezoneOffset() })
    .eq("endpoint", subscription.endpoint);
}

export async function disablePushReminder() {
  if (!pushSupported()) return;
  const registration = await getPushRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await supabase
    .from("push_subscriptions")
    .update({ enabled: false })
    .eq("endpoint", subscription.endpoint);
}

