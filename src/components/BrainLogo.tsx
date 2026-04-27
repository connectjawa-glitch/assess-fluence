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
}

// Color per assessment section (semantic via raw HSL — these are lobe accents,
// not theme tokens, intentionally vivid for engagement).
const LOBE_COLORS: Record<string, string> = {
  A: "hsl(217 91% 60%)",   // DISC – Logical/Blue
  B: "hsl(262 83% 58%)",   // MBTI – Creative/Purple
  C: "hsl(142 71% 45%)",   // Intelligence – Analytical/Green
  D: "hsl(32 95% 55%)",    // Learning – Emotional/Orange
  E: "hsl(340 82% 60%)",   // Quotients – Pink
  F: "hsl(172 66% 50%)",   // Career – Teal
};

const LOBES = [
  // 6 organic-ish wedges arranged on a brain silhouette
  { id: "A", d: "M50 18 C68 18 78 30 78 44 L50 44 Z" },
  { id: "B", d: "M50 18 C32 18 22 30 22 44 L50 44 Z" },
  { id: "C", d: "M22 44 C20 56 26 66 38 70 L50 70 L50 44 Z" },
  { id: "D", d: "M78 44 C80 56 74 66 62 70 L50 70 L50 44 Z" },
  { id: "E", d: "M38 70 C42 80 46 84 50 86 L50 70 Z" },
  { id: "F", d: "M62 70 C58 80 54 84 50 86 L50 70 Z" },
];

export function BrainLogo({ size = 96, className, animated = false, fills }: BrainLogoProps) {
  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {animated && (
        <>
          <span
            className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse"
            aria-hidden
          />
          <span
            className="absolute inset-2 rounded-full bg-secondary/20 blur-xl"
            style={{ animation: "pulse 3s ease-in-out infinite 0.6s" }}
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
            <stop offset="0%" stopColor="hsl(217 91% 60%)" />
            <stop offset="100%" stopColor="hsl(262 83% 58%)" />
          </linearGradient>
          <radialGradient id="brainGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(217 91% 60% / 0.25)" />
            <stop offset="100%" stopColor="hsl(217 91% 60% / 0)" />
          </radialGradient>
        </defs>

        {/* Background glow */}
        <circle cx="50" cy="52" r="44" fill="url(#brainGlow)" />

        {/* Outline brain shape */}
        <path
          d="M50 14 C70 14 84 28 84 46 C84 60 78 70 66 76 C64 84 56 90 50 90 C44 90 36 84 34 76 C22 70 16 60 16 46 C16 28 30 14 50 14 Z"
          fill="hsl(220 14% 96%)"
          stroke="url(#brainOutline)"
          strokeWidth="1.5"
        />

        {/* Center divider (left/right brain) */}
        <line
          x1="50"
          y1="16"
          x2="50"
          y2="88"
          stroke="hsl(220 13% 80%)"
          strokeWidth="1"
          strokeDasharray="2 2"
          className={animated ? "animate-pulse" : ""}
        />

        {/* Lobes (clipped to brain) */}
        <clipPath id="brainClip">
          <path d="M50 14 C70 14 84 28 84 46 C84 60 78 70 66 76 C64 84 56 90 50 90 C44 90 36 84 34 76 C22 70 16 60 16 46 C16 28 30 14 50 14 Z" />
        </clipPath>
        <g clipPath="url(#brainClip)">
          {LOBES.map(lobe => {
            const fill = fills?.[lobe.id] ?? 0;
            return (
              <path
                key={lobe.id}
                d={lobe.d}
                fill={LOBE_COLORS[lobe.id]}
                opacity={fills ? Math.max(0.08, fill) : (animated ? 0.18 : 0.12)}
                style={{ transition: "opacity 600ms ease, fill 400ms ease" }}
              >
                {animated && !fills && (
                  <animate
                    attributeName="opacity"
                    values="0.08;0.32;0.08"
                    dur={`${2 + Math.random() * 2}s`}
                    repeatCount="indefinite"
                  />
                )}
              </path>
            );
          })}
        </g>

        {/* Synapse dots */}
        {animated &&
          [
            [30, 36], [70, 36], [40, 56], [60, 56], [35, 70], [65, 70],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="1.6"
              fill="hsl(217 91% 60%)"
              opacity="0.8"
            >
              <animate
                attributeName="opacity"
                values="0.2;1;0.2"
                dur={`${1.4 + i * 0.2}s`}
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
