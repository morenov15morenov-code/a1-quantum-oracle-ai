const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function OracleSummon() {
  return (
    <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
      <div className="relative h-28 w-28">
        <div className="absolute inset-0 rounded-full bg-cosmic-violet/30 blur-2xl animate-pulse-slow" aria-hidden="true" />

        <div className="absolute inset-0 animate-ray-burst" aria-hidden="true">
          {RAY_ANGLES.map((angle) => (
            <span
              key={angle}
              className="absolute left-1/2 top-1/2 h-0.5 w-20 rounded-full bg-gradient-to-r from-transparent via-white to-transparent"
              style={{ transformOrigin: "0 50%", transform: `rotate(${angle}deg)` }}
            />
          ))}
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="absolute h-14 w-14 animate-flame-to-star"
            style={{ borderRadius: "0 50% 50% 50%" }}
            aria-hidden="true"
          />
          <div
            className="absolute h-7 w-7 animate-flame-flicker"
            style={{
              borderRadius: "0 50% 50% 50%",
              background: "linear-gradient(180deg, #ffffff 0%, #fde68a 60%, #fbbf24 100%)",
            }}
            aria-hidden="true"
          />
        </div>
      </div>

      <p className="text-sm font-medium text-muted-foreground">
        Consulting the Oracle
        <span aria-hidden="true">
          <span className="animate-dots">.</span>
          <span className="animate-dots [animation-delay:150ms]">.</span>
          <span className="animate-dots [animation-delay:300ms]">.</span>
        </span>
      </p>
    </div>
  );
}
