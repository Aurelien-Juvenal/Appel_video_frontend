"use client";

import { Mic, MicOff, Video, VideoOff, Square, Eye } from "lucide-react";

interface BroadcastControlBarProps {
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onStop: () => void;
  viewerCount: number;
}

export default function BroadcastControlBar({
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onStop,
  viewerCount,
}: BroadcastControlBarProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
      <ControlButton
        isOn={!isMuted}
        activeIcon={<Mic size={18} />}
        inactiveIcon={<MicOff size={18} />}
        onClick={onToggleMute}
        label={isMuted ? "Activer le micro" : "Couper le micro"}
      />
      <ControlButton
        isOn={!isCameraOff}
        activeIcon={<Video size={18} />}
        inactiveIcon={<VideoOff size={18} />}
        onClick={onToggleCamera}
        label={isCameraOff ? "Activer la caméra" : "Couper la caméra"}
      />

      <div className="mx-1 h-8 w-px bg-[var(--color-line)]" />

      <div
        title="Spectateurs connectés"
        className="flex h-11 items-center gap-1.5 rounded-full bg-[var(--color-surface-raised)] px-3.5 text-[var(--color-text-dim)]"
      >
        <Eye size={16} />
        <span className="font-mono-ui text-[13px] font-medium text-[var(--color-text)]">
          {viewerCount}
        </span>
      </div>

      <div className="mx-1 h-8 w-px bg-[var(--color-line)]" />

      <button
        onClick={onStop}
        title="Arrêter la diffusion"
        className="flex h-11 items-center gap-2 rounded-full bg-[var(--color-danger)] px-4 text-[var(--color-void)] transition-opacity hover:opacity-90"
      >
        <Square size={15} fill="currentColor" />
        <span className="font-body text-[13px] font-semibold">Arrêter</span>
      </button>
    </div>
  );
}

function ControlButton({
  isOn,
  activeIcon,
  inactiveIcon,
  onClick,
  label,
}: {
  isOn: boolean;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-pressed={!isOn}
      className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-signal)] ${
        isOn
          ? "bg-[var(--color-surface-raised)] text-[var(--color-text)] hover:bg-[var(--color-line)]"
          : "bg-[var(--color-danger)] text-[var(--color-void)] hover:opacity-90"
      }`}
    >
      {isOn ? activeIcon : inactiveIcon}
    </button>
  );
}
