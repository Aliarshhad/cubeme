/**
 * Home-screen install helpers. Captures the browser's native install prompt
 * on Android/Chrome and detects iOS + already-installed (standalone) mode.
 */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

export function subscribeInstallState(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}


export function captureInstallPrompt() {
  if (typeof window === "undefined") return;
  const onPrompt = (event: Event) => {
    event.preventDefault();
    deferredPrompt = event as InstallPromptEvent;
    notify();
  };
  const onInstalled = () => {
    deferredPrompt = null;
    notify();
  };
  window.addEventListener("beforeinstallprompt", onPrompt);
  window.addEventListener("appinstalled", onInstalled);
  return () => {
    window.removeEventListener("beforeinstallprompt", onPrompt);
    window.removeEventListener("appinstalled", onInstalled);
  };
}

export function hasInstallPrompt() {
  return deferredPrompt !== null;
}

export async function triggerInstallPrompt() {
  if (!deferredPrompt) return "unavailable" as const;
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  notify();
  return outcome;
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

export function isIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iPadOs = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadOs;
}

/** Phones and tablets only — desktop never sees the install row. */
export function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return isIos() || /Android|Mobile|Silk|Opera Mini/i.test(navigator.userAgent);
}
