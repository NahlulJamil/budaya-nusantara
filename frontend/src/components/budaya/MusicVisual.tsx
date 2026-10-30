"use client";

import { useRef, useState } from "react";

import { AppImage } from "@/components/ui/AppImage";
import {
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  VolumeIcon,
  VolumeMuteIcon,
} from "@/components/ui/icons";
import { resolveMediaUrl } from "@/lib/api";

function AudioPlayer({ src, title }: { src: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [failed, setFailed] = useState(false);

  async function startPlayback(audio: HTMLAudioElement): Promise<void> {
    try {
      await audio.play();
    } catch {
      setFailed(true);
      setPlaying(false);
    }
  }

  function togglePlay(): void {
    const audio = audioRef.current;

    if (!audio || failed) {
      return;
    }

    if (audio.paused) {
      void startPlayback(audio);
    } else {
      audio.pause();
    }
  }

  function repeatAudio(): void {
    const audio = audioRef.current;

    if (!audio || failed) {
      return;
    }

    audio.currentTime = 0;
    void startPlayback(audio);
  }

  function toggleMute(): void {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const nextMuted = !audio.muted;
    audio.muted = nextMuted;
    setMuted(nextMuted);
  }

  function retry(): void {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setFailed(false);
    setPlaying(false);
    audio.load();
  }

  return (
    <div className="mt-8 flex flex-col items-center">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => {
          setFailed(true);
          setPlaying(false);
        }}
        onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
      >
        Browser Anda tidak mendukung pemutar audio.
      </audio>

      <div className="flex items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={togglePlay}
          disabled={failed}
          aria-label={playing ? `Jeda audio ${title}` : `Putar audio ${title}`}
          title={playing ? "Jeda" : "Putar"}
          className="focus-ring inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cream-deep text-night transition-colors hover:bg-[#e0d8c5] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {playing ? (
            <PauseIcon className="h-5 w-5" />
          ) : (
            <PlayIcon className="h-5 w-5" />
          )}
        </button>

        <button
          type="button"
          onClick={repeatAudio}
          disabled={failed}
          aria-label={`Ulangi audio ${title} dari awal`}
          title="Ulangi dari awal"
          className="focus-ring inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cream-deep text-night transition-colors hover:bg-[#e0d8c5] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RepeatIcon className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={toggleMute}
          aria-pressed={muted}
          aria-label={muted ? "Nyalakan suara" : "Bisukan suara"}
          title={muted ? "Nyalakan suara" : "Bisukan suara"}
          className="focus-ring inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cream-deep text-night transition-colors hover:bg-[#e0d8c5]"
        >
          {muted ? (
            <VolumeMuteIcon className="h-5 w-5" />
          ) : (
            <VolumeIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="mt-3 min-h-[1.1em] text-center text-[11.5px] text-muted"
      >
        {failed ? "Audio gagal dimuat atau diputar." : ""}
      </p>

      {failed ? (
        <button
          type="button"
          onClick={retry}
          className="focus-ring inline-flex h-8 items-center rounded-md border border-line bg-paper px-3 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
        >
          Coba muat ulang audio
        </button>
      ) : null}
    </div>
  );
}

interface MusicVisualProps {
  title: string;
  mainImage: string | null;
  audio: string | null;
}

export function MusicVisual({ title, mainImage, audio }: MusicVisualProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = resolveMediaUrl(mainImage);
  const audioUrl = resolveMediaUrl(audio);
  const showImage = Boolean(image) && !imageFailed;

  return (
    <section aria-label="Tampilan alat musik" className="mt-10">
      <div className="relative mx-auto aspect-[4/3] w-full max-w-[520px]">
        {showImage && image ? (
          <AppImage
            src={image}
            alt={title}
            sizes="(min-width: 640px) 520px, 100vw"
            className="object-contain"
            priority
            onError={() => setImageFailed(true)}
          />
        ) : (
          <>
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#e8dfcd,transparent_70%)]"
            />
            <p className="absolute inset-0 flex items-center justify-center text-[12px] text-muted">
              Ilustrasi alat musik belum tersedia.
            </p>
          </>
        )}
      </div>

      {audioUrl ? (
        <AudioPlayer key={audioUrl} src={audioUrl} title={title} />
      ) : (
        <p className="mt-6 text-center text-[11.5px] leading-[1.7] text-muted">
          Rekaman audio belum tersedia untuk alat musik ini.
        </p>
      )}
    </section>
  );
}
