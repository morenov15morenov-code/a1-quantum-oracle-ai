function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Star {
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
}

export function Starfield({ count = 90 }: { count?: number }) {
  const rand = mulberry32(20260806);
  const stars: Star[] = Array.from({ length: count }, () => ({
    top: rand() * 100,
    left: rand() * 100,
    size: 1 + rand() * 1.6,
    delay: rand() * 6,
    duration: 3 + rand() * 5,
  }));

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {stars.map((star, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-slate-900/40 dark:bg-white/90 animate-twinkle"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
