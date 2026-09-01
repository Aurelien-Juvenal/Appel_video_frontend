"use client";

import { use, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Copy, Check, X, Film, Radio, Eye } from "lucide-react";
import VideoTile from "@/components/VideoTile";
import ControlBar from "@/components/ControlBar";
import ConnectionBadge from "@/components/ConnectionBadge";
import SourcePicker from "@/components/SourcePicker";
import { useCallRoom } from "@/lib/useCallRoom";

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const displayName = searchParams.get("name") || "Vous";

  const [copied, setCopied] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [role, setRole] = useState<"broadcaster" | "viewer" | null>(null);

  const {
    localStream,
    sourceType,
    fileName,
    isMuted,
    isCameraOff,
    status,
    participants,
    error,
    isBroadcaster,
    fileVideoRef,
    startBroadcaster,
    startViewer,
    startBroadcasterFile,
    toggleMute,
    toggleCamera,
    leaveCall,
  } = useCallRoom(roomId);

  // ⭐ Debug - afficher l'état des participants
  useEffect(() => {
    console.log("📊 Participants:", participants.length);
    participants.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} - stream: ${p.stream ? '✅' : '❌'}`);
    });
  }, [participants]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleLeave = () => {
    leaveCall();
    router.push("/");
  };

  const totalParticipants = participants.length + (localStream ? 1 : 0);

  // ⭐ Sélection du rôle
  if (!role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-void)] p-6">
        <div className="w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-8 text-center">
          <h2 className="font-display text-2xl font-semibold text-[var(--color-text)]">
            Choisissez votre rôle
          </h2>
          <p className="mt-2 font-body text-[14px] text-[var(--color-text-dim)]">
            Code du salon: <span className="font-mono-ui text-[var(--color-signal)]">{roomId}</span>
          </p>
          
          <div className="mt-6 space-y-4">
            <button
              onClick={() => {
                setRole("broadcaster");
                startBroadcaster();
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-4 text-left transition-colors hover:border-[var(--color-signal)] hover:bg-[var(--color-signal)]/5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-signal)]/15 text-[var(--color-signal)]">
                <Radio size={20} />
              </div>
              <div>
                <div className="font-body text-[14px] font-semibold text-[var(--color-text)]">
                  📡 Diffuseur
                </div>
                <div className="font-body text-[12px] text-[var(--color-text-faint)]">
                  Diffusez votre caméra ou vidéo
                </div>
              </div>
            </button>
            
            <button
              onClick={() => {
                setRole("viewer");
                startViewer();
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-4 text-left transition-colors hover:border-[var(--color-signal)] hover:bg-[var(--color-signal)]/5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-text-faint)]/15 text-[var(--color-text-faint)]">
                <Eye size={20} />
              </div>
              <div>
                <div className="font-body text-[14px] font-semibold text-[var(--color-text)]">
                  👁️ Téléspectateur
                </div>
                <div className="font-body text-[12px] text-[var(--color-text-faint)]">
                  Regardez la diffusion en direct
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ⭐ Si c'est un diffuseur, montrer le SourcePicker
  if (role === "broadcaster" && sourceType === "none") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-void)] p-6">
        <div className="w-full max-w-md">
          <div className="mb-4 text-center">
            <h2 className="font-display text-xl font-semibold text-[var(--color-text)]">
              📡 Diffusion en cours
            </h2>
            <p className="mt-1 font-body text-[13px] text-[var(--color-text-dim)]">
              Salon: <span className="font-mono-ui text-[var(--color-signal)]">{roomId}</span>
            </p>
            <p className="mt-1 font-body text-[12px] text-[var(--color-text-faint)]">
              Choisissez votre source pour commencer la diffusion
            </p>
          </div>
          
          <SourcePicker
            onPickWebcam={startBroadcaster}
            onPickFile={startBroadcasterFile}
            error={error}
          />
        </div>
      </div>
    );
  }

  // ⭐ Vue principale - Diffuseur ou Téléspectateur
  return (
    <main className="flex min-h-screen flex-col bg-[var(--color-void)]">
      {/* Élément vidéo caché pour la lecture de fichiers */}
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
          
          {/* Badge rôle */}
          {isBroadcaster ? (
            <span className="flex items-center gap-1.5 rounded-md border border-[var(--color-signal)]/30 bg-[var(--color-signal)]/10 px-2.5 py-1 font-mono-ui text-[11px] text-[var(--color-signal)]">
              <Radio size={12} />
              DIFFUSEUR
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-md border border-[var(--color-text-faint)]/30 bg-[var(--color-text-faint)]/10 px-2.5 py-1 font-mono-ui text-[11px] text-[var(--color-text-faint)]">
              <Eye size={12} />
              TÉLÉSPECTATEUR
            </span>
          )}
          
          {/* Badge fichier */}
          {sourceType === "file" && fileName && (
            <span className="flex items-center gap-1.5 rounded-md border border-[var(--color-signal)]/30 bg-[var(--color-signal)]/10 px-2.5 py-1 font-mono-ui text-[11px] text-[var(--color-signal)]">
              <Film size={12} />
              {fileName}
            </span>
          )}
        </div>
        <ConnectionBadge status={status} />
      </header>

      {/* Erreur */}
      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-4 py-3 font-body text-[13px] text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {/* Video grid */}
      <div className="flex flex-1 items-center justify-center p-6 pb-32">
        <div className="w-full max-w-4xl">
          {/* ⭐ Diffuseur: affiche son propre stream */}
          {isBroadcaster && localStream && (
            <div className="rounded-xl border border-[var(--color-signal)]/30 overflow-hidden">
              <VideoTile
                stream={localStream}
                label={sourceType === "file" ? fileName ?? displayName : displayName}
                isLocal
                isMuted={isMuted}
                isCameraOff={isCameraOff}
              />
            </div>
          )}

          {/* ⭐ Téléspectateur: affiche le stream du diffuseur */}
          {!isBroadcaster && participants.length > 0 && (
            <div className="rounded-xl border border-[var(--color-signal)]/30 overflow-hidden">
              {participants.map((p) => (
                <VideoTile
                  key={p.id}
                  stream={p.stream}
                  label={p.name}
                  isMuted={p.isMuted}
                  isCameraOff={p.isCameraOff}
                />
              ))}
            </div>
          )}

          {/* ⭐ Message d'attente pour les téléspectateurs */}
          {!isBroadcaster && participants.length === 0 && status === "live" && (
            <div className="flex aspect-video flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] text-center p-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-text-faint)]/10">
                <Eye size={40} className="text-[var(--color-text-faint)]" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-[var(--color-text-dim)]">
                  En attente du diffuseur...
                </h3>
                <p className="mt-2 max-w-md font-body text-[14px] text-[var(--color-text-faint)]">
                  Le diffuseur n'a pas encore commencé sa diffusion. 
                  Partagez le code <span className="font-mono-ui text-[var(--color-signal)]">{roomId}</span> 
                  pour inviter quelqu'un à diffuser.
                </p>
              </div>
            </div>
          )}

          {/* ⭐ Message hors ligne pour les téléspectateurs */}
          {!isBroadcaster && status === "offline" && (
            <div className="flex aspect-video flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] text-center p-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-danger)]/10">
                <Radio size={40} className="text-[var(--color-danger)]" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-[var(--color-text-dim)]">
                  🔌 Hors ligne
                </h3>
                <p className="mt-2 font-body text-[14px] text-[var(--color-text-faint)]">
                  Le diffuseur n'est pas connecté. Veuillez réessayer plus tard.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="fixed inset-x-0 bottom-8 flex justify-center">
        <ControlBar
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onLeave={handleLeave}
          onToggleParticipants={() => setShowParticipants((v) => !v)}
          participantCount={totalParticipants}
        />
      </div>

      {/* Participants panel */}
      {showParticipants && (
        <div className="fixed inset-y-0 right-0 z-10 w-72 border-l border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-semibold text-[var(--color-text)]">
              Participants ({totalParticipants})
            </h2>
            <button
              onClick={() => setShowParticipants(false)}
              className="rounded-full p-1 text-[var(--color-text-faint)] transition-colors hover:bg-[var(--color-line)] hover:text-[var(--color-text)]"
            >
              <X size={16} />
            </button>
          </div>
          
          <ul className="flex flex-col gap-3">
            {/* Utilisateur courant */}
            {isBroadcaster && localStream && (
              <li className="flex items-center gap-2.5 rounded-lg bg-[var(--color-signal)]/5 px-3 py-2 font-body text-[13px] text-[var(--color-text)]">
                <span className="h-2 w-2 rounded-full bg-[var(--color-signal)] animate-pulse" />
                {displayName}
                <span className="ml-auto text-[11px] text-[var(--color-signal)] font-mono-ui">DIFFUSEUR</span>
              </li>
            )}
            {!isBroadcaster && (
              <li className="flex items-center gap-2.5 rounded-lg bg-[var(--color-text-faint)]/5 px-3 py-2 font-body text-[13px] text-[var(--color-text)]">
                <span className="h-2 w-2 rounded-full bg-[var(--color-text-faint)]" />
                {displayName}
                <span className="ml-auto text-[11px] text-[var(--color-text-faint)] font-mono-ui">TÉLÉSPECTATEUR</span>
              </li>
            )}
            
            {/* Autres participants */}
            {participants.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 font-body text-[13px] text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]"
              >
                <span className={`h-2 w-2 rounded-full ${p.isBroadcaster ? 'bg-[var(--color-signal)] animate-pulse' : 'bg-[var(--color-text-faint)]'}`} />
                {p.name}
                {p.isBroadcaster && (
                  <span className="ml-auto text-[11px] text-[var(--color-signal)] font-mono-ui">DIFFUSEUR</span>
                )}
              </li>
            ))}
          </ul>
          
          {participants.length === 0 && !isBroadcaster && (
            <div className="mt-6 text-center font-body text-[13px] text-[var(--color-text-faint)]">
              Aucun autre participant
            </div>
          )}
        </div>
      )}
    </main>
  );
}