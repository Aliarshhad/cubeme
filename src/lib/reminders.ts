import { useEffect } from "react";

const LAST_FIRED_KEY = "cube-reminder-last-fired";

export function reminderPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestReminderPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported" as const;
  return Notification.requestPermission();
}

function msUntil(time: string) {
  const [h, m] = time.split(":").map((n) => Number(n) || 0);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h ?? 21, m ?? 0, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

function todayKey() {
  return new Date().toDateString();
}

function fire() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (localStorage.getItem(LAST_FIRED_KEY) === todayKey()) return;
  localStorage.setItem(LAST_FIRED_KEY, todayKey());
  new Notification("Cube — log today's spending", {
    body: "A minute now keeps your budget honest. Open Cube and add today's expenses.",
    icon: "/icon-192.png",
    tag: "cube-daily-reminder",
  });
}

/**
 * Fires a local daily notification at the chosen time while the app is open,
 * and catches up if the time already passed today and nothing was sent.
 */
export function useDailyReminder(enabled: boolean, time: string) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const [h, m] = time.split(":").map((n) => Number(n) || 0);
    const now = new Date();
    const passed =
      now.getHours() > (h ?? 21) || (now.getHours() === (h ?? 21) && now.getMinutes() >= (m ?? 0));
    if (passed) fire();

    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      fire();
      interval = setInterval(fire, 24 * 60 * 60 * 1000);
    }, msUntil(time));

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [enabled, time]);
}
