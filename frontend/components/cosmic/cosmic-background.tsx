import { Starfield } from "./starfield";

export function CosmicBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, hsl(340 80% 50%) 0%, hsl(0 70% 35%) 30%, hsl(25 80% 30%) 55%, hsl(0 0% 5%) 85%)" }} />
      <div className="absolute -top-48 left-1/4 h-[34rem] w-[34rem] rounded-full bg-fuchsia-600/20 blur-[130px] animate-pulse-slow" />
      <div className="absolute top-1/3 -right-40 h-[30rem] w-[30rem] rounded-full bg-red-500/15 blur-[130px] animate-pulse-slow [animation-delay:1.5s]" />
      <div className="absolute -bottom-32 left-0 h-[28rem] w-[28rem] rounded-full bg-amber-500/15 blur-[130px] animate-pulse-slow [animation-delay:3s]" />
      <div className="absolute top-2/3 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-pink-500/10 blur-[120px] animate-pulse-slow [animation-delay:4.5s]" />
      <Starfield />
      <span className="absolute left-1/2 top-[-2%] h-[2px] w-28 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-cosmic-violet to-transparent animate-meteor" />
    </div>
  );
}
