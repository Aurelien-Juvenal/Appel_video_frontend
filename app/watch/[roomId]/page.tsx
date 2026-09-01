"use client";

import { use, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RadioTower, VolumeX } from "lucide-react";
import ConnectionBadge from "@/components/ConnectionBadge";
import { useWatchRoom } from "@/lib/useWatchRoom";

export default function WatchPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const { status, broadcastStream, broadcastEnded, error, leave } =
    useWatchRoom(roomId);

  useEffect(() => {
    if (videoRef.current && broadcastStream) {
      videoRef.current.srcObject = broadcastStream;
    }
  }, [broadcastStream]);

  const handleLeave = () => {
    leave();
    router.push("/");
  };

  return (
    <main className="flex min-h-screen flex-col bg-[var(--color-void)]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-[15px] font-semibold text-[var(--color-text)]">
            Liaison
          </span>
          <span className="h-4 w-px bg-[var(--color-line)]" />
          <span className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1 font-mono-ui text-[12px] tracking-wide text-[var(--color-text-dim)]">
            {roomId}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionBadge status={status} />
          <button
            onClick={handleLeave}
            title="Quitter"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-dim)] transition-colors hover:bg-[var(--color-danger)] hover:text-[var(--color-void)]"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-4 py-3 font-body text-[13px] text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {/* Zone de visionnage */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          {broadcastStream ? (
            <div className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="aspect-video w-full bg-black object-contain"
              />
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--color-line)] text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-faint)]">
                {broadcastEnded ? <VolumeX size={20} /> : <RadioTower size={20} />}
              </div>
              <div>
                <p className="font-body text-[14px] font-medium text-[var(--color-text)]">
                  {broadcastEnded
                    ? "La diffusion est terminée"
                    : "En attente du diffuseur"}
                </p>
                <p className="mt-1 font-body text-[12.5px] text-[var(--color-text-faint)]">
                  {broadcastEnded
                    ? "Le diffuseur a quitté le salon."
                    : "La vidéo apparaîtra dès que quelqu'un commencera à diffuser."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
