import { useMusic } from "@/lib/music";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX, Music } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function MusicControls() {
  const { muted, setMuted, volume, setVolume, trackName, playing } = useMusic();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          aria-label="Music settings"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span className="hidden sm:inline text-xs">Music</span>
          {playing && !muted && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold truncate">{trackName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setMuted(!muted)}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Slider
              value={[Math.round(volume * 100)]}
              onValueChange={(v) => setVolume(v[0] / 100)}
              max={100}
              step={1}
              className="flex-1"
              aria-label="Volume"
            />
            <span className="text-xs w-8 text-right tabular-nums">{Math.round(volume * 100)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Background music plays during your test for a calm, focused experience.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
