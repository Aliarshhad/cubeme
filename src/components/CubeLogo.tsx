import logo from "@/assets/cube-mark.png.asset.json";
import { cn } from "@/lib/utils";

export function CubeLogo({ className }: { className?: string }) {
  return (
    <img
      src={logo.url}
      alt="Cube logo"
      className={cn(
        "h-9 w-auto select-none drop-shadow-[0_0_18px_rgba(225,29,72,0.45)]",
        className,
      )}
    />
  );
}

export function CubeWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <CubeLogo />
      <span className="font-display text-2xl uppercase tracking-[0.2em] text-foreground">Cube</span>
    </div>
  );
}
