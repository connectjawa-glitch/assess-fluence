import { BrainLogo } from "./BrainLogo";

interface Props {
  message?: string;
}

export default function LoadingScreen({ message = "Preparing your experience..." }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <BrainLogo size={140} animated />
      <h2 className="mt-6 text-xl font-display font-bold text-gradient animate-fade-in">
        Personality &amp; Intelligence Assessment
      </h2>
      <p className="mt-2 text-sm text-muted-foreground animate-fade-in">{message}</p>
      <div className="mt-6 flex gap-1.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            style={{ animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}
