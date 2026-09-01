"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConnectionStatus,
  SignalingMessage,
  generateUserId,
  waitForIceGatheringComplete,
} from "./webrtc";

// captureStream() n'est pas encore dans le lib.dom.d.ts officiel de
// TypeScript bien qu'il soit supporté par Chrome/Firefox/Edge.
declare global {
  interface HTMLVideoElement {
    captureStream?: () => MediaStream;
  }
}

/**
 * Hook de gestion du rôle DIFFUSEUR dans un salon.
 *
 * Deux sources possibles pour le flux publié :
 *  - la webcam (getUserMedia)
 *  - un fichier vidéo déposé par l'utilisateur (lu dans une balise
 *    <video> cachée, puis capturé avec captureStream())
 *
 * Se connecte au serveur média avec ?role=broadcaster, publie le flux
 * choisi, et le serveur le relaie à tous les spectateurs du salon.
 * Le diffuseur ne reçoit aucun flux en retour (il ne fait qu'émettre).
 */

export type SourceType = "none" | "webcam" | "file";

export function useBroadcastRoom(roomId: string) {
  const [userId] = useState(generateUserId);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [sourceType, setSourceType] = useState<SourceType>("none");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [viewerCount, setViewerCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  // Élément <video> caché utilisé pour lire un fichier déposé et en
  // extraire un MediaStream via captureStream(). Doit être rendu dans le
  // DOM par le composant consommateur (voir la page diffuseur).
  const fileVideoRef = useRef<HTMLVideoElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const stopCurrentSource = useCallback(() => {
    localStream?.getTracks().forEach((track) => track.stop());
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, [localStream]);

  // ----- Source 1 : webcam -----
  const startWebcam = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      stopCurrentSource();
      setLocalStream(stream);
      setSourceType("webcam");
      setFileName(null);
    } catch {
      setError(
        "Impossible d'accéder à la caméra/micro. Vérifiez les autorisations du navigateur."
      );
    }
  }, [stopCurrentSource]);

  // ----- Source 2 : fichier vidéo déposé -----
  const startVideoFile = useCallback(
    async (file: File) => {
      setError(null);
      const videoEl = fileVideoRef.current;
      if (!videoEl) {
        setError("Lecteur vidéo indisponible, réessayez.");
        return;
      }
      if (!videoEl.captureStream) {
        setError(
          "Votre navigateur ne supporte pas la capture de flux depuis un fichier vidéo (essayez Chrome ou Firefox)."
        );
        return;
      }

      try {
        stopCurrentSource();
        const url = URL.createObjectURL(file);
        objectUrlRef.current = url;
        videoEl.src = url;
        videoEl.loop = true;
        videoEl.muted = false;
        await videoEl.play();

        const stream = videoEl.captureStream!();
        setLocalStream(stream);
        setSourceType("file");
        setFileName(file.name);
      } catch {
        setError("Impossible de lire ce fichier vidéo.");
      }
    },
    [stopCurrentSource]
  );

  const stopSource = useCallback(() => {
    stopCurrentSource();
    setLocalStream(null);
    setSourceType("none");
    setFileName(null);
  }, [stopCurrentSource]);

  // ----- Connexion WebRTC réelle au serveur média (rôle diffuseur) -----
  const signalingUrl = process.env.NEXT_PUBLIC_SIGNALING_URL;

  useEffect(() => {
    if (!localStream) return;

    if (!signalingUrl) {
      // Pas de backend configuré : on reste en mode "prévisualisation locale"
      const timeout = setTimeout(() => setStatus("offline"), 0);
      return () => clearTimeout(timeout);
    }

    let cancelled = false;
    const resetTimeout = setTimeout(() => setStatus("connecting"), 0);

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    // Publie le flux local (webcam ou fichier) vers le serveur média
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    pc.onconnectionstatechange = () => {
      if (cancelled) return;
      if (pc.connectionState === "connected") {
        setStatus("live");
      } else if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected" ||
        pc.connectionState === "closed"
      ) {
        setStatus("offline");
      }
    };

    const ws = new WebSocket(
      `${signalingUrl}/ws/${roomId}/${userId}?role=broadcaster`
    );
    wsRef.current = ws;

    ws.onopen = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await waitForIceGatheringComplete(pc);
        if (cancelled || !pc.localDescription) return;
        ws.send(JSON.stringify({ type: "offer", sdp: pc.localDescription.sdp }));
      } catch {
        setError("Impossible d'établir la connexion avec le serveur média.");
      }
    };

    ws.onerror = () => setStatus("offline");
    ws.onclose = () => {
      if (!cancelled) setStatus("offline");
    };

    ws.onmessage = async (event) => {
      const data: SignalingMessage = JSON.parse(event.data);

      if (data.type === "answer") {
        await pc.setRemoteDescription({ type: "answer", sdp: data.sdp });
      } else if (data.type === "error") {
        // Ex : un autre diffuseur est déjà actif dans ce salon
        setError(data.message);
      } else if (data.type === "peer-left") {
        setViewerCount((count) => Math.max(0, count - 1));
      }
    };

    return () => {
      cancelled = true;
      clearTimeout(resetTimeout);
      ws.close();
      pc.getSenders().forEach((sender) => sender.track?.stop());
      pc.close();
      pcRef.current = null;
    };
  }, [localStream, roomId, signalingUrl, userId]);

  // Interroge périodiquement le nombre de spectateurs connectés
  useEffect(() => {
    if (!signalingUrl || status !== "live") return;
    const httpBase = signalingUrl.replace(/^ws/, "http");

    const poll = async () => {
      try {
        const res = await fetch(`${httpBase}/rooms/${roomId}`);
        if (!res.ok) return;
        const data = await res.json();
        setViewerCount(data.viewer_count ?? 0);
      } catch {
        // silencieux : la prochaine tentative réessaiera
      }
    };

    poll();
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, [signalingUrl, roomId, status]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStream?.getAudioTracks().forEach((track) => {
        track.enabled = !next;
      });
      return next;
    });
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    setIsCameraOff((prev) => {
      const next = !prev;
      localStream?.getVideoTracks().forEach((track) => {
        track.enabled = !next;
      });
      return next;
    });
  }, [localStream]);

  const leaveCall = useCallback(() => {
    stopCurrentSource();
    wsRef.current?.close();
    pcRef.current?.close();
  }, [stopCurrentSource]);

  // Nettoyage à la destruction du composant
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  return {
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
    stopSource,
    toggleMute,
    toggleCamera,
    leaveCall,
  };
}
