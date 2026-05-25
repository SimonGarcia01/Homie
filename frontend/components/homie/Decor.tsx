import { Sprout, Leaf } from "lucide-react";

export const LeafBackdrop = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
    {/* soft garden gradient */}
    <div className="absolute inset-0 bg-gradient-garden" />
    {/* botanical svg motifs */}
    <svg className="absolute -top-20 -right-24 w-[520px] opacity-[0.18] text-primary animate-sway" viewBox="0 0 400 400" fill="none">
      <path d="M200 40 C 260 120, 320 180, 280 300 C 240 360, 160 360, 120 300 C 80 180, 140 120, 200 40 Z" fill="currentColor"/>
      <path d="M200 60 L200 340" stroke="hsl(var(--background))" strokeWidth="2" opacity="0.4"/>
    </svg>
    <svg className="absolute -bottom-32 -left-20 w-[460px] opacity-[0.14] text-secondary" viewBox="0 0 400 400" fill="none">
      <path d="M40 360 C 120 280, 200 240, 360 220" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <ellipse cx="120" cy="300" rx="40" ry="18" fill="currentColor" transform="rotate(-25 120 300)"/>
      <ellipse cx="220" cy="252" rx="42" ry="16" fill="currentColor" transform="rotate(-20 220 252)"/>
      <ellipse cx="320" cy="225" rx="36" ry="14" fill="currentColor" transform="rotate(-15 320 225)"/>
    </svg>
    {/* faint grain */}
    <div className="absolute inset-0 bg-grain opacity-40 mix-blend-multiply" />
  </div>
);

export const SmallSprout = ({ className = "" }: { className?: string }) => (
  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary ${className}`}>
    <Sprout className="h-5 w-5" />
  </span>
);

export const LeafIcon = Leaf;
