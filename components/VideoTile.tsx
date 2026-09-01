"use client";

import { useEffect, useRef } from "react";
import { MicOff } from "lucide-react";

interface VideoTileProps {
  stream: MediaStream | null;
  label: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isCameraOff?: boolean;
  speaking?: boolean;
}

export default function VideoTile({
  stream,
  label,
  isLocal = false,
  isMuted = false,
  isCameraOff = false,
  speaking = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = label
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`group relative aspect-video overflow-hidden rounded-xl border bg-[var(--color-surface)] transition-colors ${
        speaking
          ? "border-[var(--color-signal)]"
          : "border-[var(--color-line)]"
      }`}
    >
      {stream && !isCameraOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`h-full w-full object-cover ${isLocal ? "-scale-x-100" : ""}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[var(--color-surface-raised)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-line)] font-display text-sm font-semibold text-[var(--color-text-dim)]">
            {initials || "?"}
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 py-2.5">
        <span className="font-body text-[13px] font-medium text-[var(--color-text)]">
          {label}
          {isLocal && (
            <span className="text-[var(--color-text-faint)]"> (vous)</span>
          )}
        </span>
        {isMuted && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50">
            <MicOff size={13} className="text-[var(--color-danger)]" />
          </span>
        )}
      </div>
    </div>
  );
}
