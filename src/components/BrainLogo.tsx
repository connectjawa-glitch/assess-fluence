import { cn } from "@/lib/utils";

interface BrainLogoProps {
  size?: number;
  className?: string;
  /** Idle pulse + glow + synapses — used on Login & Loading */
  animated?: boolean;
  /**
   * Per-section fill (0-1) for the 6 brain "lobes".
   * Order: A,B,C,D,E,F.
   */
  fills?: Record<string, number>;
  /** Currently active section id — that lobe gets a stronger outline / glow */
  activeSection?: string;
}

// Vivid color per assessment section — matches the reference screenshot palette.
const LOBE_COLORS: Record<string, string> = {
  A: "hsl(262 90% 68%)",   // DISC          — Violet
  B: "hsl(190 95% 58%)",   // MBTI          — Cyan
  C: "hsl(295 85% 65%)",   // Intelligence  — Magenta
  D: "hsl(150 70% 55%)",   // Learning      — Mint
  E: "hsl(42 100% 62%)",   // Quotients     — Amber
  F: "hsl(340 88% 65%)",   // Career        — Rose
};

/**
 * Six anatomical lobes covering the brain silhouette.
 *   A = front-top-left (frontal L)
 *   B = front-top-right (frontal R)
 *   C = mid-left (parietal/temporal L)
 *   D = mid-right (parietal/temporal R)
 *   E = lower-left (cerebellum / occipital L)
 *   F = lower-right (cerebellum / occipital R)
 */
const LOBES = [
  { id: "A", d: "M50 14 C32 14 20 26 18 42 L50 46 Z" },
  { id: "B", d: "M50 14 C68 14 80 26 82 42 L50 46 Z" },
  { id: "C", d: "M18 42 C16 56 22 66 36 70 L50 70 L50 46 Z" },
  { id: "D", d: "M82 42 C84 56 78 66 64 70 L50 70 L50 46 Z" },
  { id: "E", d: "M36 70 C38 80 44 86 50 88 L50 70 Z" },
  { id: "F", d: "M64 70 C62 80 56 86 50 88 L50 70 Z" },
];

/**
 * Anatomical "gyri" — soft curved highlight lines suggesting brain folds.
 * Layered: deep sulci (shadow) → mid gyri → bright crests.
 */
const GYRI = [
  "M22 28 C30 22 40 22 50 26",
  "M50 26 C60 22 70 22 78 28",
  "M18 40 C28 36 40 38 50 42",
  "M50 42 C60 38 72 36 82 40",
  "M22 52 C32 48 42 50 50 54",
  "M50 54 C58 50 68 48 78 52",
  "M26 62 C34 58 42 60 48 64",
  "M52 64 C58 60 66 58 74 62",
  "M38 76 C42 74 46 76 49 78",
  "M51 78 C54 76 58 74 62 76",
];

const SULCI = [
  "M28 32 C36 28 44 28 50 32",
  "M50 32 C56 28 64 28 72 32",
  "M22 48 C32 44 42 46 50 50",
  "M50 50 C58 46 68 44 78 48",
  "M30 60 C38 56 46 58 50 62",
  "M50 62 C58 58 66 60 72 62",
];

/** Tiny extra crest highlights — make folds catch light */
const CRESTS = [
  "M30 30 C36 26 44 26 49 29",
  "M51 29 C56 26 64 26 70 30",
  "M28 50 C36 47 44 48 50 51",
  "M50 51 C56 48 64 47 72 50",
];

/** Brain stem under the cerebellum — gives it a real "brain" silhouette */
const BRAIN_STEM = "M46 86 C46 92 48 96 50 98 C52 96 54 92 54 86 Z";

/** Outer brain silhouette — used everywhere */
const BRAIN_PATH =
  "M50 12 C72 12 86 26 86 46 C86 60 80 70 68 76 C66 84 58 92 50 92 C42 92 34 84 32 76 C20 70 14 60 14 46 C14 26 28 12 50 12 Z";

export function BrainLogo({
  size = 96,
  className,
  animated = false,
  fills,
  activeSection,
}: BrainLogoProps) {
  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {/* Outer glow halos — softly pulse in idle mode */}
      {animated && (
        <>
          <span
            className="absolute inset-0 rounded-full bg-primary/30 blur-3xl animate-pulse"
            aria-hidden
          />
          <span
            className="absolute inset-3 rounded-full bg-secondary/25 blur-2xl"
            style={{ animation: "pulse 3.6s ease-in-out infinite 0.6s" }}
            aria-hidden
          />
        </>
      )}

      {/* Active-section colored halo — visible during the assessment */}
      {activeSection && LOBE_COLORS[activeSection] && (
        <span
          className="absolute inset-0 rounded-full blur-3xl opacity-50 transition-colors duration-700"
          style={{ background: LOBE_COLORS[activeSection] + "55" }}
          aria-hidden
        />
      )}

      <svg
        viewBox="0 0 100 102"
        width={size}
        height={size}
        className={cn("relative drop-shadow-2xl", animated && "animate-[fade-in_.6s_ease-out]")}
        style={{
          // Subtle "breathing" — the whole brain inhales/exhales gently. Disabled
          // automatically by `prefers-reduced-motion` via index.css.
          animation: animated || activeSection ? "brain-breath 6s ease-in-out infinite" : undefined,
          transformOrigin: "50% 50%",
          willChange: "transform",
        }}
      >
        <defs>
          <linearGradient id="brainOutline" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(190 95% 70%)" />
            <stop offset="100%" stopColor="hsl(262 90% 70%)" />
          </linearGradient>

          <radialGradient id="brainGlow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="hsl(217 91% 60% / 0.30)" />
            <stop offset="100%" stopColor="hsl(217 91% 60% / 0)" />
          </radialGradient>

          {/* Dark base — deeper, more dimensional */}
          <radialGradient id="brainBase" cx="42%" cy="32%" r="78%">
            <stop offset="0%" stopColor="hsl(222 38% 22%)" />
            <stop offset="55%" stopColor="hsl(222 47% 11%)" />
            <stop offset="100%" stopColor="hsl(222 60% 4%)" />
          </radialGradient>

          {/* Glossy upper-left highlight — gives it volume */}
          <radialGradient id="brainSheen" cx="35%" cy="18%" r="58%">
            <stop offset="0%" stopColor="hsl(0 0% 100% / 0.22)" />
            <stop offset="60%" stopColor="hsl(0 0% 100% / 0.04)" />
            <stop offset="100%" stopColor="hsl(0 0% 100% / 0)" />
          </radialGradient>

          {/* Bottom-right ambient occlusion — grounds the shape */}
          <radialGradient id="brainShadow" cx="70%" cy="80%" r="55%">
            <stop offset="0%" stopColor="hsl(0 0% 0% / 0.35)" />
            <stop offset="100%" stopColor="hsl(0 0% 0% / 0)" />
          </radialGradient>

          {/* Per-lobe wash gradient — layered so the fill has depth */}
          {LOBES.map(l => (
            <radialGradient key={l.id} id={`fill-${l.id}`} cx="40%" cy="35%" r="75%">
              <stop offset="0%" stopColor={LOBE_COLORS[l.id]} stopOpacity="1" />
              <stop offset="55%" stopColor={LOBE_COLORS[l.id]} stopOpacity="0.85" />
              <stop offset="100%" stopColor={LOBE_COLORS[l.id]} stopOpacity="0.4" />
            </radialGradient>
          ))}

          {/* Per-lobe specular highlight — wet, glossy look */}
          {LOBES.map(l => (
            <radialGradient key={`spec-${l.id}`} id={`spec-${l.id}`} cx="35%" cy="25%" r="40%">
              <stop offset="0%" stopColor="hsl(0 0% 100% / 0.55)" />
              <stop offset="100%" stopColor="hsl(0 0% 100% / 0)" />
            </radialGradient>
          ))}

          {/* Soft inner shadow inside each lobe — depth */}
          <radialGradient id="lobeDepth" cx="50%" cy="50%" r="70%">
            <stop offset="60%" stopColor="hsl(0 0% 0% / 0)" />
            <stop offset="100%" stopColor="hsl(0 0% 0% / 0.32)" />
          </radialGradient>

          {/* Liquid-fill gradient that animates per active lobe */}
          <linearGradient id="liquidShimmer" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(0 0% 100% / 0.45)" />
            <stop offset="50%" stopColor="hsl(0 0% 100% / 0)" />
            <stop offset="100%" stopColor="hsl(0 0% 100% / 0.45)" />
          </linearGradient>

          {/* Brain silhouette mask — used everywhere */}
          <clipPath id="brainClip">
            <path d={BRAIN_PATH} />
          </clipPath>

          {/* Soft blur filter for synapse halos */}
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.8" />
          </filter>
        </defs>

        {/* Background glow */}
        <circle cx="50" cy="52" r="48" fill="url(#brainGlow)" />

        {/* Brain stem (drawn first so it sits behind the brain) */}
        <path d={BRAIN_STEM} fill="hsl(222 47% 14%)" stroke="url(#brainOutline)" strokeWidth="0.6" opacity="0.85" />

        {/* Outline brain shape — dark base */}
        <path
          d={BRAIN_PATH}
          fill="url(#brainBase)"
          stroke="url(#brainOutline)"
          strokeWidth="1.4"
        />

        {/* All lobe content is clipped to the brain silhouette */}
        <g clipPath="url(#brainClip)">
          {/* Sulci shadows — drawn under the fills to suggest depth */}
          {SULCI.map((d, i) => (
            <path
              key={`sulci-${i}`}
              d={d}
              fill="none"
              stroke="hsl(0 0% 0%)"
              strokeOpacity="0.4"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          ))}

          {/* Lobes */}
          {LOBES.map(lobe => {
            const fill = fills?.[lobe.id] ?? 0;
            const isActive = activeSection === lobe.id;
            // Smoother S-curve — partial fills look richer earlier, full fills saturate gracefully
            const eased = 0.10 + (1 - Math.cos(Math.min(fill, 1) * Math.PI)) / 2 * 0.90;
            const baseOpacity = fills
              ? eased
              : (animated ? 0.25 : 0.18);

            return (
              <g key={lobe.id}>
                {/* Color wash */}
                <path
                  d={lobe.d}
                  fill={`url(#fill-${lobe.id})`}
                  opacity={baseOpacity}
                  style={{
                    transition: "opacity 1600ms cubic-bezier(.22,.9,.18,1)",
                    filter: fill > 0 ? `drop-shadow(0 0 1.8px ${LOBE_COLORS[lobe.id]})` : undefined,
                  }}
                >
                  {animated && !fills && (
                    <animate
                      attributeName="opacity"
                      values="0.15;0.40;0.15"
                      dur={`${2.6 + Math.random() * 2}s`}
                      repeatCount="indefinite"
                    />
                  )}
                </path>

                {/* Wet specular highlight — only meaningful once the lobe has fill */}
                {fill > 0.05 && (
                  <path
                    d={lobe.d}
                    fill={`url(#spec-${lobe.id})`}
                    opacity={Math.min(0.5, fill * 0.6)}
                    style={{ transition: "opacity 1600ms cubic-bezier(.22,.9,.18,1)" }}
                  />
                )}

                {/* Depth shadow inside the lobe */}
                <path
                  d={lobe.d}
                  fill="url(#lobeDepth)"
                  opacity={fill > 0 ? 0.5 : 0.22}
                  style={{ transition: "opacity 1400ms ease" }}
                />

                {/* Active-section accent stroke that breathes */}
                {isActive && (
                  <>
                    <path
                      d={lobe.d}
                      fill="none"
                      stroke={LOBE_COLORS[lobe.id]}
                      strokeWidth="1.5"
                      opacity="0.95"
                    >
                      <animate attributeName="opacity" values="0.55;1;0.55" dur="2.4s" repeatCount="indefinite" />
                      <animate attributeName="stroke-width" values="1.2;1.9;1.2" dur="2.4s" repeatCount="indefinite" />
                    </path>
                    {/* Liquid shimmer sweeping across the active lobe */}
                    <path d={lobe.d} fill="url(#liquidShimmer)" opacity="0.55">
                      <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="-30 0;30 0;-30 0"
                        dur="3.6s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </>
                )}
              </g>
            );
          })}

          {/* Mid-tone gyri */}
          {GYRI.map((d, i) => (
            <path
              key={`gyri-${i}`}
              d={d}
              fill="none"
              stroke="hsl(0 0% 100%)"
              strokeOpacity="0.18"
              strokeWidth="0.7"
              strokeLinecap="round"
            />
          ))}

          {/* Bright crests on top — true highlight catching light */}
          {CRESTS.map((d, i) => (
            <path
              key={`crest-${i}`}
              d={d}
              fill="none"
              stroke="hsl(0 0% 100%)"
              strokeOpacity="0.32"
              strokeWidth="0.45"
              strokeLinecap="round"
            />
          ))}

          {/* Bottom-right ambient occlusion */}
          <path d={BRAIN_PATH} fill="url(#brainShadow)" />

          {/* Glossy sheen on the upper-left — gives the brain volume */}
          <path d={BRAIN_PATH} fill="url(#brainSheen)" />
        </g>

        {/* Center divider (left/right brain) — subtle */}
        <line
          x1="50"
          y1="14"
          x2="50"
          y2="90"
          stroke="hsl(0 0% 100% / 0.22)"
          strokeWidth="0.7"
          strokeDasharray="1.5 2"
        />

        {/* Synapse dots — firing constantly. In assessment mode they fire on
            the active lobe more brightly. */}
        {[
          { cx: 28, cy: 30, sec: "A" },
          { cx: 72, cy: 30, sec: "B" },
          { cx: 26, cy: 54, sec: "C" },
          { cx: 74, cy: 54, sec: "D" },
          { cx: 38, cy: 76, sec: "E" },
          { cx: 62, cy: 76, sec: "F" },
          { cx: 50, cy: 40, sec: "B" },
          { cx: 50, cy: 60, sec: "D" },
        ].map((s, i) => {
          const isActive = activeSection === s.sec;
          const fill = fills?.[s.sec] ?? (animated ? 0.5 : 0);
          const dotColor = LOBE_COLORS[s.sec] ?? "hsl(190 90% 65%)";
          if (!animated && fill === 0) return null;
          return (
            <g key={i}>
              <circle
                cx={s.cx}
                cy={s.cy}
                r={isActive ? 1.8 : 1.3}
                fill={dotColor}
                opacity={isActive ? 0.95 : 0.7}
                filter="url(#softGlow)"
              >
                <animate
                  attributeName="opacity"
                  values={isActive ? "0.4;1;0.4" : "0.2;0.85;0.2"}
                  dur={`${1.2 + i * 0.18}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="r"
                  values={isActive ? "1.2;2.2;1.2" : "1;1.5;1"}
                  dur={`${1.2 + i * 0.18}s`}
                  repeatCount="indefinite"
                />
              </circle>
              {/* Halo around active synapses */}
              {isActive && (
                <circle cx={s.cx} cy={s.cy} r="3" fill="none" stroke={dotColor} strokeWidth="0.4" opacity="0.6">
                  <animate attributeName="r" values="2;5;2" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export const SECTION_LOBE_COLORS = LOBE_COLORS;

export default BrainLogo;
