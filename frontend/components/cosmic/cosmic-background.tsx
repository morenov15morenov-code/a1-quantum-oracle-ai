import { Starfield } from "./starfield";

export function CosmicBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-100 via-white to-fuchsia-50 dark:from-[#0a0718] dark:via-[#070312] dark:to-black" />
      <div className="absolute -top-48 left-1/4 h-[34rem] w-[34rem] rounded-full bg-violet-500/15 dark:bg-violet-600/30 blur-[130px] animate-pulse-slow" />
      <div className="absolute top-1/3 -right-40 h-[30rem] w-[30rem] rounded-full bg-cyan-400/15 dark:bg-cyan-500/25 blur-[130px] animate-pulse-slow [animation-delay:1.5s]" />
      <div className="absolute -bottom-32 left-0 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/15 dark:bg-fuchsia-600/25 blur-[130px] animate-pulse-slow [animation-delay:3s]" />
      <div className="absolute top-2/3 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-[120px] animate-pulse-slow [animation-delay:4.5s]" />
      <Starfield />
      <span className="absolute left-1/2 top-[-2%] h-[2px] w-28 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-cosmic-violet to-transparent animate-meteor" />
    </div>
  );
}
