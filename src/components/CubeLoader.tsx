import { useEffect, useState } from "react";

import logo from "@/assets/cube-mark.png.asset.json";
import { cn } from "@/lib/utils";

/**
 * Full-screen pre-loader tied to real loading state.
 * When `show` flips to false it fades out over 250ms and unmounts.
 */
export function CubeLoader({ show = true }: { show?: boolean }) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      return;
    }
    const t = setTimeout(() => setVisible(false), 250);
    return () => clearTimeout(t);
  }, [show]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "glow-field fixed inset-0 z-100 flex flex-col items-center justify-center bg-background transition-opacity duration-[250ms]",
        show ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="cube-tumble-scene relative flex items-center justify-center">
        <span
          aria-hidden
          className="cube-glow-pulse absolute h-40 w-40 rounded-full bg-primary/35 blur-3xl"
        />
        <img
          src={logo.url}
          alt="Cube"
          className="cube-tumble relative w-[124px] select-none drop-shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
        />
      </div>

      <p className="mt-8 flex items-center gap-1 font-display text-sm tracking-tight text-foreground/55">
        Loading Cube
        <span className="ml-0.5 flex gap-0.5">
          <span className="cube-dot">.</span>
          <span className="cube-dot" style={{ animationDelay: "0.2s" }}>
            .
          </span>
          <span className="cube-dot" style={{ animationDelay: "0.4s" }}>
            .
          </span>
        </span>
      </p>
    </div>
  );
}
