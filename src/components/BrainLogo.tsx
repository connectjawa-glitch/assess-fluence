import { cn } from "@/lib/utils";

interface BrainLogoProps {
  size?: number;
  className?: string;
  /** Animated pulse + glow + halves drift apart — used on Login & Loading */
  animated?: boolean;
  /**
   * Per-section fill (0-1) for the 6 brain "lobes" representing each section.
   * Order: A,B,C,D,E,F. Used inside the Assessment.
   */
  fills?: Record<string, number>;
  /** Currently active section id — that lobe gets a stronger outline / glow */
  activeSection?: string;
}

// Color per assessment section — matches the reference screenshot palette.
// (Kept as raw HSL because these are content accents, not theme tokens.)
const LOBE_COLORS: Record<string, string> = {
  A: "hsl(262 83% 65%)",   // DISC          — Violet
  B: "hsl(190 90% 55%)",   // MBTI          — Cyan
  C: "hsl(290 80% 60%)",   // Intelligence  — Magenta
  D: "hsl(150 65% 55%)",   // Learning      — Mint
  E: "hsl(45 95% 60%)",    // Quotients     — Amber
  F: "hsl(340 82% 62%)",   // Career        — Rose
};

// Six anatomical-ish lobes laid out on a brain silhouette.
// Order roughly: A=front-top-left, B=front-top-right, C=mid-left,
// D=mid-right, E=lower-left (cerebellum-ish), F=lower-right.
const LOBES = [
  { id: "A", d: "M50 16 C68 16 80 28 82 42 L50 46 Z" },
  { id: "B", d: "M50 16 C32 16 20 28 18 42 L50 46 Z" },
  { id: "C", d: "M18 42 C16 56 22 66 36 70 L50 70 L50 46 Z" },
  { id: "D", d: "M82 42 C84 56 78 66 64 70 L50 70 L50 46 Z" },
  { id: "E", d: "M36 70 C38 80 44 86 50 88 L50 70 Z" },
  { id: "F", d: "M64 70 C62 80 56 86 50 88 L50 70 Z" },
];

// Anatomical "gyri" (folds) — soft curved lines drawn over each lobe to make
// the silhouette read as a real brain.
const GYRI = [
  "M28 30 C36 26 44 26 50 30",
  "M50 30 C56 26 64 26 72 30",
  "M22 44 C30 40 40 42 48 46",
  "M52 46 C60 42 70 40 78 44",
  "M28 56 C36 52 44 54 50 58",
  "M50 58 C56 54 64 52 72 56",
  "M36 68 C42 66 48 68 50 72",
  "M50 72 C52 68 58 66 64 68",
];

export function BrainLogo({ size = 96, className, animated = false, fills, activeSection }: BrainLogoProps) {
  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {animated && (
        <>
          <span
            className="absolute inset-0 rounded-full bg-primary/25 blur-3xl animate-pulse"
            aria-hidden
          />
          <span
            className="absolute inset-3 rounded-full bg-secondary/20 blur-2xl"
            style={{ animation: "pulse 3.6s ease-in-out infinite 0.6s" }}
            aria-hidden
          />
        </>
      )}
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={cn("relative drop-shadow-md", animated && "animate-[fade-in_.6s_ease-out]")}
      >
        <defs>
          <linearGradient id="brainOutline" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(217 91% 65%)" />
            <stop offset="100%" stopColor="hsl(262 83% 65%)" />
          </linearGradient>
          <radialGradient id="brainGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(217 91% 60% / 0.30)" />
            <stop offset="100%" stopColor="hsl(217 91% 60% / 0)" />
          </radialGradient>
          <linearGradient id="brainBase" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(222 47% 14%)" />
            <stop offset="100%" stopColor="hsl(222 47% 8%)" />
          </linearGradient>
          {/* per-lobe wash gradient — used to make the fill feel layered, not flat */}
          {LOBES.map(l => (
            <radialGradient key={l.id} id={`fill-${l.id}`} cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor={LOBE_COLORS[l.id]} stopOpacity="0.95" />
              <stop offset="100%" stopColor={LOBE_COLORS[l.id]} stopOpacity="0.55" />
            </radialGradient>
          ))}
        </defs>

        {/* Background glow */}
        <circle cx="50" cy="52" r="46" fill="url(#brainGlow)" />

        {/* Outline brain shape (dark base so vivid lobes pop like the reference) */}
        <path
          d="M50 12 C72 12 86 26 86 46 C86 60 80 70 68 76 C66 84 58 92 50 92 C42 92 34 84 32 76 C20 70 14 60 14 46 C14 26 28 12 50 12 Z"
          fill="url(#brainBase)"
          stroke="url(#brainOutline)"
          strokeWidth="1.2"
        />

        {/* Lobes (clipped to brain) */}
        <clipPath id="brainClip">
          <path d="M50 12 C72 12 86 26 86 46 C86 60 80 70 68 76 C66 84 58 92 50 92 C42 92 34 84 32 76 C20 70 14 60 14 46 C14 26 28 12 50 12 Z" />
        </clipPath>
        <g clipPath="url(#brainClip)">
          {LOBES.map(lobe => {
            const fill = fills?.[lobe.id] ?? 0;
            const isActive = activeSection === lobe.id;
            // Base translucent wash so the lobe shape always reads
            const baseOpacity = fills
              ? Math.max(0.10, fill * 0.95)
              : (animated ? 0.22 : 0.16);
            return (
              <g key={lobe.id}>
                <path
                  d={lobe.d}
                  fill={`url(#fill-${lobe.id})`}
                  opacity={baseOpacity}
                  style={{ transition: "opacity 1200ms cubic-bezier(.2,.8,.2,1)" }}
                >
                  {animated && !fills && (
                    <animate
                      attributeName="opacity"
                      values="0.10;0.34;0.10"
                      dur={`${2.4 + Math.random() * 2}s`}
                      repeatCount="indefinite"
                    />
                  )}
                </path>
                {/* active-section accent stroke that breathes */}
                {isActive && (
                  <path
                    d={lobe.d}
                    fill="none"
                    stroke={LOBE_COLORS[lobe.id]}
                    strokeWidth="1.2"
                    opacity="0.9"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.4;1;0.4"
                      dur="2.2s"
                      repeatCount="indefinite"
                    />
                  </path>
                )}
              </g>
            );
          })}

          {/* Anatomical gyri — soft white folds layered over the lobes */}
          {GYRI.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="hsl(0 0% 100%)"
              strokeOpacity="0.18"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* Center divider (left/right brain) */}
        <line
          x1="50"
          y1="14"
          x2="50"
          y2="90"
          stroke="hsl(0 0% 100% / 0.25)"
          strokeWidth="0.8"
          strokeDasharray="2 2"
        />

        {/* Synapse dots — only when in animated/idle mode */}
        {animated &&
          [
            [30, 34], [70, 34], [40, 54], [60, 54], [35, 70], [65, 70],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="1.3"
              fill="hsl(190 90% 65%)"
              opacity="0.85"
            >
              <animate
                attributeName="opacity"
                values="0.2;1;0.2"
                dur={`${1.6 + i * 0.25}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
      </svg>
    </div>
  );
}

export const SECTION_LOBE_COLORS = LOBE_COLORS;

export default BrainLogo;
