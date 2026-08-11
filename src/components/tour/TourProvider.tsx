import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import { useBudgets, useProfile } from "@/hooks/use-cube";
import { logActivity } from "@/lib/activity";
import * as api from "@/lib/api";
import { cn } from "@/lib/utils";
import { TOUR_FLAG_KEY, TOUR_STEPS } from "./steps";

type Rect = { top: number; left: number; width: number; height: number };

type TourContextValue = { startTour: () => void; active: boolean };

const TourContext = createContext<TourContextValue>({ startTour: () => {}, active: false });

export function useTour() {
  return useContext(TourContext);
}

function localFlag() {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(TOUR_FLAG_KEY) === "1";
}

export function TourProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profile = useProfile();
  const budgets = useBudgets();

  const [index, setIndex] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [closing, setClosing] = useState(false);

  const active = index !== null;
  const step = index === null ? null : TOUR_STEPS[index];

  const startTour = useCallback(() => {
    setClosing(false);
    setRect(null);
    setIndex(0);
    void navigate({ to: "/dashboard" });
  }, [navigate]);

  /* Auto-run once, after a first budget exists and only if never finished. */
  const hasBudget = (budgets.data ?? []).some((b) => b.amount > 0);
  const finished = !!profile.data?.tour_completed_at || localFlag();

  useEffect(() => {
    if (!profile.data || !budgets.data) return;
    if (finished || active || closing) return;
    if (!hasBudget) return;
    startTour();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.data, budgets.data, finished, hasBudget]);

  /* Navigate to the step's screen. */
  useEffect(() => {
    if (!step) return;
    void navigate({ to: step.route });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  /* Track the highlighted element, waiting for it to render after navigation. */
  useEffect(() => {
    if (!step) return;
    let cancelled = false;
    let raf = 0;

    const measure = () => {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      if (!el) {
        raf = requestAnimationFrame(measure);
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.top < 80 || r.bottom > window.innerHeight - 200) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      raf = requestAnimationFrame(measure);
    };

    raf = requestAnimationFrame(measure);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const end = useCallback(async () => {
    setIndex(null);
    setRect(null);
    setClosing(true);
    if (typeof localStorage !== "undefined") localStorage.setItem(TOUR_FLAG_KEY, "1");
    void navigate({ to: "/dashboard" });
    try {
      await api.updateProfile({ tour_completed_at: new Date().toISOString() });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch {
      /* the local flag already prevents a repeat */
    }
  }, [navigate, queryClient]);

  const value = useMemo(() => ({ startTour, active }), [startTour, active]);

  return (
    <TourContext.Provider value={value}>
      {children}
      {active && step && (
        <TourOverlay
          rect={rect}
          text={step.text}
          index={index as number}
          total={TOUR_STEPS.length}
          onNext={() => {
            if ((index as number) + 1 >= TOUR_STEPS.length) void end();
            else setIndex((i) => (i as number) + 1);
          }}
          onSkip={() => void end()}
        />
      )}
      {closing && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 pb-24 sm:items-center sm:pb-4">
          <div className="glass w-full max-w-sm space-y-4 rounded-3xl p-6 text-center">
            <p className="font-display text-lg tracking-tight">You&apos;re all set</p>
            <p className="text-sm text-muted-foreground">
              You can replay this tour anytime from Settings → Replay tutorial.
            </p>
            <Button
              className="h-11 w-full"
              onClick={() => {
                setClosing(false);
                void logActivity("tour", "Finished the guided tour");
              }}
            >
              Cube it
            </Button>
          </div>
        </div>
      )}
    </TourContext.Provider>
  );
}

function TourOverlay({
  rect,
  text,
  index,
  total,
  onNext,
  onSkip,
}: {
  rect: Rect | null;
  text: string;
  index: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const pad = 8;
  const below = rect ? rect.top + rect.height + 16 : 120;
  const tooltipBelow = !rect || below < window.innerHeight - 220;

  return (
    <div className="fixed inset-0 z-[110]">
      {rect ? (
        <div
          className="tour-ring pointer-events-none absolute rounded-2xl"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/78" />
      )}

      <button
        onClick={onSkip}
        className="absolute right-4 top-4 rounded-full bg-black/60 px-4 py-2 text-sm text-white/90 backdrop-blur-sm"
      >
        Skip
      </button>

      <div
        className={cn(
          "absolute inset-x-4 mx-auto max-w-sm",
          tooltipBelow ? "" : "bottom-auto",
        )}
        style={
          rect
            ? tooltipBelow
              ? { top: below }
              : { top: Math.max(72, rect.top - 190) }
            : { top: 120 }
        }
      >
        <div className="glass space-y-4 rounded-3xl p-5">
          <p className="text-sm leading-relaxed">{text}</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: total }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    i === index ? "bg-primary" : "bg-foreground/25",
                  )}
                />
              ))}
            </div>
            <Button size="sm" onClick={onNext} className="px-5">
              {index + 1 === total ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
