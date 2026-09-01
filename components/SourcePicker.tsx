"use client";

import { useCallback, useRef, useState } from "react";
import { Camera, Upload, Film } from "lucide-react";

interface SourcePickerProps {
  onPickWebcam: () => void;
  onPickFile: (file: File) => void;
  error: string | null;
}

export default function SourcePicker({
  onPickWebcam,
  onPickFile,
  error,
}: SourcePickerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("video/")) {
        onPickFile(file);
      }
    },
    [onPickFile]
  );

  return (
    <div className="rise-in flex w-full max-w-lg flex-col gap-5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-7">
      <div className="text-center">
        <h2 className="font-display text-[20px] font-semibold text-[var(--color-text)]">
          Choisir une source de diffusion
        </h2>
        <p className="mt-1.5 font-body text-[13px] text-[var(--color-text-dim)]">
          Diffusez votre caméra en direct ou déposez un fichier vidéo à
          diffuser en continu.
        </p>
      </div>

      <button
        onClick={onPickWebcam}
        className="flex items-center gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-4 text-left transition-colors hover:border-[var(--color-signal)]"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-signal)]/15 text-[var(--color-signal)]">
          <Camera size={19} />
        </div>
        <div>
          <div className="font-body text-[14px] font-semibold text-[var(--color-text)]">
            Diffuser ma caméra
          </div>
          <div className="font-body text-[12px] text-[var(--color-text-faint)]">
            Flux en direct depuis votre webcam et micro
          </div>
        </div>
      </button>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed p-6 text-center transition-colors ${
          isDragging
            ? "border-[var(--color-signal)] bg-[var(--color-signal)]/5"
            : "border-[var(--color-line)] hover:border-[var(--color-text-faint)]"
        }`}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-dim)]">
          <Upload size={18} />
        </div>
        <div>
          <div className="font-body text-[14px] font-semibold text-[var(--color-text)]">
            Déposer une vidéo
          </div>
          <div className="mt-0.5 font-body text-[12px] text-[var(--color-text-faint)]">
            Glissez un fichier ici, ou cliquez pour parcourir (.mp4, .webm)
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPickFile(file);
          }}
        />
      </label>

      {error && (
        <div className="rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3.5 py-2.5 font-body text-[12.5px] text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-[var(--color-line)] pt-4 font-body text-[11.5px] text-[var(--color-text-faint)]">
        <Film size={13} />
        La vidéo déposée est diffusée en boucle pour les autres participants
        du salon.
      </div>
    </div>
  );
}
