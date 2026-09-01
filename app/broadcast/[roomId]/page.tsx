"use client";

import { use, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Copy, Check, Film } from "lucide-react";
import VideoTile from "@/components/VideoTile";
import BroadcastControlBar from "@/components/BroadcastControlBar";
import ConnectionBadge from "@/components/ConnectionBadge";
import SourcePicker from "@/components/SourcePicker";
import { useBroadcastRoom } from "@/lib/useBroadcastRoom";

export default function BroadcastPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const displayName = searchParams.get("name") || "Diffuseur";

  const [copied, setCopied] = useState(false);

  const {
    localStream,
    sourceType,
    fileName,
    isMuted,
    isCameraOff,
    status,
    viewerCount,
    error,
    fileVideoRef,
    startWebcam,
    startVideoFile,
    toggleMute,
    toggleCamera,
    leaveCall,
  } = useBroadcastRoom(roomId);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleStop = () => {
    leaveCall();
    router.push("/");
  };

  const hasSource = sourceType !== "none";

  return (
    <main className="flex min-h-screen flex-col bg-[var(--color-void)]">
      {/* Élément vidéo caché : lit le fichier déposé pour en extraire un
          MediaStream via captureStream(). Doit rester dans le DOM. */}
      <video ref={fileVideoRef} className="hidden" playsInline />

      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-[15px] font-semibold text-[var(--color-text)]">
            Liaison
          </span>
          <span className="h-4 w-px bg-[var(--color-line)]" />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1 font-mono-ui text-[12px] tracking-wide text-[var(--color-text-dim)] transition-colors hover:border-[var(--color-signal)] hover:text-[var(--color-text)]"
            title="Copier le code du salon"
          >
            {roomId}
            {copied ? (
              <Check size={12} className="text-[var(--color-signal)]" />
            ) : (
              <Copy size={12} />
            )}
          </button>
          {sourceType === "file" && fileName && (
            <span className="flex items-center gap-1.5 rounded-md border border-[var(--color-signal)]/30 bg-[var(--color-signal)]/10 px-2.5 py-1 font-mono-ui text-[11px] text-[var(--color-signal)]">
              <Film size={12} />
              {fileName}
            </span>
          )}
        </div>
        <ConnectionBadge status={status} />
      </header>

      {!hasSource ? (
        // ----- Lobby : choix de la source avant de diffuser -----
        <div className="flex flex-1 items-center justify-center p-6">
          <SourcePicker
            onPickWebcam={startWebcam}
            onPickFile={startVideoFile}
            error={error}
          />
        </div>
      ) : (
        <>
          {error && (
            <div className="mx-6 mt-4 rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-4 py-3 font-body text-[13px] text-[var(--color-danger)]">
              {error}
            </div>
          )}

          {/* Aperçu du flux diffusé */}
          <div className="flex flex-1 items-center justify-center p-6 pb-32">
            <div className="w-full max-w-3xl">
              <VideoTile
                stream={localStream}
                label={sourceType === "file" ? fileName ?? displayName : displayName}
                isLocal
                isMuted={isMuted}
                isCameraOff={isCameraOff}
              />
              <p className="mt-3 text-center font-body text-[12.5px] text-[var(--color-text-faint)]">
                Partagez le code{" "}
                <span className="font-mono-ui text-[var(--color-text-dim)]">
                  {roomId}
                </span>{" "}
                pour que d&apos;autres personnes puissent regarder votre diffusion.
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="fixed inset-x-0 bottom-8 flex justify-center">
            <BroadcastControlBar
              isMuted={isMuted}
              isCameraOff={isCameraOff}
              onToggleMute={toggleMute}
              onToggleCamera={toggleCamera}
              onStop={handleStop}
              viewerCount={viewerCount}
            />
          </div>
        </>
      )}
    </main>
  );
}
