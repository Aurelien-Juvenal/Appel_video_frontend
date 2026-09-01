"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConnectionStatus,
  SignalingMessage,
  generateUserId,
  waitForIceGatheringComplete,
} from "./webrtc";

/**
 * Hook de gestion du rôle SPECTATEUR dans un salon.
 *
 * Ne publie jamais aucun flux : se connecte au serveur média avec
 * ?role=viewer et reçoit uniquement le flux relayé du diffuseur.
 */
export function useWatchRoom(roomId: string) {
  const [userId] = useState(generateUserId);

  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [broadcastStream, setBroadcastStream] = useState<MediaStream | null>(
    null
  );
  const [broadcastEnded, setBroadcastEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const signalingUrl = process.env.NEXT_PUBLIC_SIGNALING_URL;

  useEffect(() => {
    if (!signalingUrl) {
      const timeout = setTimeout(() => setStatus("offline"), 0);
      return () => clearTimeout(timeout);
    }

    let cancelled = false;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    // Transceivers en réception seule : garantit que l'offre initiale a
    // bien des sections média (m-lines) à négocier, même si aucun flux
    // n'est encore disponible côté diffuseur.
    pc.addTransceiver("video", { direction: "recvonly" });
    pc.addTransceiver("audio", { direction: "recvonly" });

    // On reconstruit nous-mêmes le MediaStream à partir des pistes reçues :
    // aiortc (le serveur média) ne regroupe pas garanti les pistes relayées
    // sous un même identifiant de flux (event.streams peut être vide),
    // contrairement à l'API navigateur classique.
    const remoteStream = new MediaStream();

    pc.ontrack = (event) => {
      remoteStream.addTrack(event.track);
      setBroadcastEnded(false);
      setBroadcastStream(remoteStream);
    };

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

    const ws = new WebSocket(`${signalingUrl}/ws/${roomId}/${userId}?role=viewer`);
    wsRef.current = ws;

    ws.onopen = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await waitForIceGatheringComplete(pc);
        if (cancelled || !pc.localDescription) return;
        ws.send(JSON.stringify({ type: "offer", sdp: pc.localDescription.sdp }));
      } catch {
        setError("Impossible de se connecter au serveur média.");
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
      } else if (data.type === "broadcaster-left") {
        setBroadcastStream(null);
        setBroadcastEnded(true);
      } else if (data.type === "error") {
        setError(data.message);
      }
    };

    return () => {
      cancelled = true;
      ws.close();
      pc.close();
      pcRef.current = null;
    };
  }, [roomId, signalingUrl, userId]);

  const leave = useCallback(() => {
    wsRef.current?.close();
    pcRef.current?.close();
  }, []);

  return {
    status,
    broadcastStream,
    broadcastEnded,
    error,
    leave,
  };
}
