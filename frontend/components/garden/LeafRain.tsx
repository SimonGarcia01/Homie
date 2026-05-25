import { useMemo } from "react";

/**
 * Graphic falling leaves backdrop — visible, painterly silhouettes.
 */
export function LeafRain({ count = 16 }: { count?: number }) {
  const leaves = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = -Math.random() * 25;
        const duration = 18 + Math.random() * 14;
        const size = 18 + Math.random() * 18;
        const drift = (Math.random() * 120 - 60).toFixed(0);
        const opacity = 0.28 + Math.random() * 0.22;
        const palette = [
          "hsl(var(--secondary))",
          "hsl(var(--primary))",
          "hsl(var(--accent))",
          "hsl(var(--primary-glow))",
        ];
        const hue = palette[i % palette.length];
        const swayDur = 3.5 + Math.random() * 3;
        const shape = i % 3; // 0 leaf, 1 maple-ish, 2 small leaf
        const startRot = Math.floor(Math.random() * 360);
        return { i, left, delay, duration, size, drift, opacity, hue, swayDur, shape, startRot };
      }),
    [count],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden motion-reduce:hidden"
    >
      {leaves.map((l) => (
        <span
          key={l.i}
          className="absolute -top-12 leaf-fall"
          style={{
            left: `${l.left}%`,
            animationDelay: `${l.delay}s`,
            animationDuration: `${l.duration}s`,
            // @ts-ignore custom prop
            "--drift": `${l.drift}px`,
          } as React.CSSProperties}
        >
          <span
            className="block leaf-sway"
            style={{ animationDuration: `${l.swayDur}s`, transform: `rotate(${l.startRot}deg)` }}
          >
            <LeafSvg shape={l.shape} size={l.size} color={l.hue} opacity={l.opacity} />
          </span>
        </span>
      ))}
    </div>
  );
}

function LeafSvg({ shape, size, color, opacity }: { shape: number; size: number; color: string; opacity: number }) {
  const style = {
    opacity,
    filter: "drop-shadow(0 2px 3px hsl(30 25% 15% / 0.18))",
  } as React.CSSProperties;

  if (shape === 1) {
    // maple-ish leaf
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" style={style}>
        <path
          d="M16 2 L19 9 L26 7 L22 14 L29 16 L22 19 L25 26 L18 23 L16 30 L14 23 L7 26 L10 19 L3 16 L10 14 L6 7 L13 9 Z"
          fill={color}
        />
        <path d="M16 8 L16 26" stroke="hsl(30 20% 18% / 0.35)" strokeWidth="0.7" fill="none" />
      </svg>
    );
  }
  if (shape === 2) {
    // small round leaf
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" style={style}>
        <path
          d="M16 4 C24 6 28 12 28 18 C28 24 22 28 16 28 C10 28 4 24 4 18 C4 12 8 6 16 4 Z"
          fill={color}
        />
        <path d="M16 8 C18 14 18 22 16 28" stroke="hsl(30 20% 18% / 0.3)" strokeWidth="0.7" fill="none" />
      </svg>
    );
  }
  // classic teardrop leaf
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style}>
      <path
        d="M16 2 C8 8 4 16 4 22 C4 27 8 30 13 30 C22 30 28 22 30 6 C30 6 24 10 16 8 Z"
        fill={color}
      />
      <path d="M12 26 C16 20 22 14 28 10" stroke="hsl(30 20% 18% / 0.35)" strokeWidth="0.8" fill="none" />
    </svg>
  );
}
