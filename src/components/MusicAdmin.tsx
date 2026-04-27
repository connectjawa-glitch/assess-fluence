import { useRef, useState } from "react";
import { useMusic } from "@/lib/music";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Music, Upload, RotateCcw, Play, Pause } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export default function MusicAdmin() {
  const { trackName, currentSrc, setCustomTrack, resetTrack, start, stop, playing, volume, setVolume } = useMusic();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast({ title: "Unsupported file", description: "Please upload an audio file (mp3, wav, m4a).", variant: "destructive" });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: "File too large", description: "Maximum 10 MB.", variant: "destructive" });
      return;
    }
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      setCustomTrack(reader.result as string, file.name);
      toast({ title: "Track updated", description: `${file.name} is now the active background track.` });
      setBusy(false);
    };
    reader.onerror = () => {
      toast({ title: "Upload failed", variant: "destructive" });
      setBusy(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" /> Background Music
        </CardTitle>
        <p className="text-xs text-muted-foreground">Upload an MP3 / WAV that plays during the assessment.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="p-4 rounded-xl bg-muted/40 border flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Now using</p>
            <p className="font-display font-semibold truncate">{trackName}</p>
          </div>
          <Button
            size="icon"
            variant="outline"
            onClick={() => (playing ? stop() : start())}
            aria-label={playing ? "Pause preview" : "Play preview"}
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold">Preview volume</p>
          <Slider
            value={[Math.round(volume * 100)]}
            onValueChange={(v) => setVolume(v[0] / 100)}
            max={100}
            step={1}
          />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <div
          className="p-6 rounded-xl border-2 border-dashed border-primary/30 text-center cursor-pointer hover:border-primary/60 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
        >
          <Upload className="w-8 h-8 mx-auto text-primary mb-2" />
          <p className="font-display font-semibold">Click or drop an audio file</p>
          <p className="text-xs text-muted-foreground mt-1">MP3, WAV, M4A — up to 10 MB</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
            <Upload className="w-4 h-4 mr-1" /> Upload new track
          </Button>
          <Button variant="ghost" size="sm" onClick={resetTrack}>
            <RotateCcw className="w-4 h-4 mr-1" /> Reset to default
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground italic break-all">
          Source: {currentSrc.startsWith("data:") ? "Custom upload (stored locally)" : currentSrc}
        </p>
      </CardContent>
    </Card>
  );
}
