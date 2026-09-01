"use client";

import { Mic, MicOff, Video, VideoOff, PhoneOff, Users } from "lucide-react";

interface ControlBarProps {
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
  onToggleParticipants: () => void;
  participantCount: number;
}

export default function ControlBar({
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onLeave,
  onToggleParticipants,
  participantCount,
}: ControlBarProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
      <ControlButton
        active={!isMuted}
        activeIcon={<Mic size={18} />}
        inactiveIcon={<MicOff size={18} />}
        isOn={!isMuted}
        onClick={onToggleMute}
        label={isMuted ? "Activer le micro" : "Couper le micro"}
      />
      <ControlButton
        active={!isCameraOff}
        activeIcon={<Video size={18} />}
        inactiveIcon={<VideoOff size={18} />}
        isOn={!isCameraOff}
        onClick={onToggleCamera}
        label={isCameraOff ? "Activer la caméra" : "Couper la caméra"}
      />

      <div className="mx-1 h-8 w-px bg-[var(--color-line)]" />

      <button
        onClick={onToggleParticipants}
        title="Participants"
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-dim)] transition-colors hover:bg-[var(--color-line)] hover:text-[var(--color-text)]"
      >
        <Users size={18} />
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-signal)] px-1 font-mono-ui text-[9px] font-medium text-[var(--color-void)]">
          {participantCount}
        </span>
      </button>

      <div className="mx-1 h-8 w-px bg-[var(--color-line)]" />

      <button
        onClick={onLeave}
        title="Quitter l'appel"
        className="flex h-11 items-center gap-2 rounded-full bg-[var(--color-danger)] px-4 text-[var(--color-void)] transition-opacity hover:opacity-90"
      >
        <PhoneOff size={17} />
        <span className="font-body text-[13px] font-semibold">Quitter</span>
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
  active: boolean;
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
