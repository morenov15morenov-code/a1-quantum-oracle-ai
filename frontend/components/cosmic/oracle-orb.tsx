import { cn } from "@/lib/utils";

interface OracleOrbProps {
  className?: string;
}

export function OracleOrb({ className }: OracleOrbProps) {
  return (
    <div className={cn("relative aspect-square", className)} aria-hidden="true">
      <div className="absolute inset-0 rounded-full bg-cosmic-violet/40 blur-3xl animate-orbit-glow" />
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cosmic-violet via-cosmic-indigo to-[#05020f] opacity-90" />
      <div className="absolute inset-[10%] rounded-full bg-gradient-to-tr from-cosmic-cyan/40 via-white/30 to-transparent blur-[2px]" />
      <div className="absolute inset-[26%] rounded-full bg-white/25 blur-md" />
      <div className="absolute inset-[40%] rounded-full bg-white/40 blur-sm" />

      <div className="absolute -inset-[30%] animate-spin-slower">
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-cosmic-cyan shadow-[0_0_12px_3px_rgba(34,211,238,0.8)]" />
      </div>
      <div className="absolute -inset-[30%] rounded-full border border-cosmic-violet/40 [border-top-color:transparent]" />
      <div className="absolute -inset-[18%] animate-spin-slower-rev">
        <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cosmic-gold shadow-[0_0_10px_2px_rgba(251,191,36,0.8)]" />
      </div>
      <div className="absolute -inset-[18%] rounded-full border border-cosmic-cyan/40 [border-bottom-color:transparent]" />
      <div className="absolute -inset-[45%] rounded-full border border-dashed border-cosmic-fuchsia/25 animate-spin-slower [animation-duration:70s]" />
    </div>
  );
}
