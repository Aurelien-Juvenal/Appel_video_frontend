"use client";

import { useEffect, useRef, useState } from "react";

interface Participant {
  id: string;
  name: string;
  stream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  speaking: boolean;
  isBroadcaster: boolean;
}

export function useCallRoom(roomId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [sourceType, setSourceType] = useState<"none" | "webcam" | "file">("none");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [status, setStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isBroadcaster, setIsBroadcaster] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const fileVideoRef = useRef<HTMLVideoElement | null>(null);
  const userId = useRef(`user-${Date.now()}`).current;
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());

  const cleanup = () => {
    console.log("🧹 Nettoyage");
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    remoteStreamsRef.current.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    remoteStreamsRef.current.clear();
  };

  // ⭐ Supprimer toutes les extensions RTP
  const stripAllExtensions = (sdp: string): string => {
    const lines = sdp.split('\n');
    const result: string[] = [];
    for (const line of lines) {
      if (!line.trim().startsWith('a=extmap:')) {
        result.push(line);
      }
    }
    return result.join('\n');
  };

  const startBroadcaster = async () => {
    try {
      setError(null);
      setIsBroadcaster(true);
      console.log("📡 Démarrage DIFFUSEUR...");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
      
      console.log("✅ Stream diffuseur:", stream.getTracks().length, "tracks");
      setLocalStream(stream);
      localStreamRef.current = stream;
      setSourceType("webcam");
      
      await initializeCall(stream, true);
    } catch (err) {
      console.error("❌ Erreur webcam:", err);
      if (err instanceof Error && err.name === 'NotReadableError') {
        setError("Impossible d'accéder à la caméra. Vérifiez qu'aucune autre application ne l'utilise.");
      } else {
        setError("Impossible d'accéder à la caméra/micro");
      }
    }
  };

  const startViewer = async () => {
    try {
      setError(null);
      setIsBroadcaster(false);
      console.log("👁️ Démarrage TÉLÉSPECTATEUR...");
      
      setLocalStream(null);
      localStreamRef.current = null;
      setSourceType("none");
      
      await initializeCall(null, false);
    } catch (err) {
      console.error("❌ Erreur:", err);
      setError("Erreur de connexion");
    }
  };

  const startBroadcasterFile = async (file: File) => {
    try {
      setError(null);
      setIsBroadcaster(true);
      console.log("🎬 Fichier:", file.name);
      setFileName(file.name);
      setSourceType("file");

      const video = fileVideoRef.current;
      if (!video) {
        setError("Référence vidéo non disponible");
        return;
      }

      const url = URL.createObjectURL(file);
      video.src = url;
      await video.load();
      
      const stream = video.captureStream();
      
      if (stream.getAudioTracks().length === 0) {
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const dest = ctx.createMediaStreamDestination();
        oscillator.connect(dest);
        oscillator.start();
        const audioTrack = dest.stream.getAudioTracks()[0];
        stream.addTrack(audioTrack);
      }

      setLocalStream(stream);
      localStreamRef.current = stream;
      
      await initializeCall(stream, true);
      
      video.loop = true;
      await video.play();
    } catch (err) {
      console.error("❌ Erreur fichier:", err);
      setError("Impossible de lire le fichier vidéo");
    }
  };

  const initializeCall = async (stream: MediaStream | null, isBroadcasterRole: boolean) => {
    try {
      setStatus("connecting");
      console.log(`🔌 Connexion WebRTC (${isBroadcasterRole ? 'DIFFUSEUR' : 'TÉLÉSPECTATEUR'})...`);

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
        bundlePolicy: "balanced",
        rtcpMuxPolicy: "require",
      });
      peerConnectionRef.current = pc;

      // ⭐ Ajouter les tracks locales (seulement pour le diffuseur)
      if (stream && isBroadcasterRole) {
        stream.getTracks().forEach(track => {
          console.log(`➕ Ajout track ${track.kind}`);
          pc.addTrack(track, stream);
        });
        console.log(`✅ ${stream.getTracks().length} tracks ajoutées`);
      }

      // ⭐ Gérer les tracks distantes (pour le téléspectateur)
      pc.ontrack = (event) => {
        console.log(`📡 Track distante reçue: ${event.track.kind}`);
        const remoteStream = event.streams[0];
        if (!remoteStream) {
          console.warn("⚠️ Pas de stream dans ontrack");
          return;
        }

        console.log(`📡 Stream reçu avec ${remoteStream.getTracks().length} tracks`);
        
        // Ajouter le stream aux participants
        setParticipants(prev => {
          // Vérifier si ce stream existe déjà
          const exists = prev.some(p => p.stream === remoteStream);
          if (!exists) {
            console.log("👤 Nouveau participant ajouté");
            return [...prev, {
              id: `remote-${Date.now()}`,
              name: "Diffuseur",
              stream: remoteStream,
              isMuted: false,
              isCameraOff: false,
              speaking: false,
              isBroadcaster: true,
            }];
          }
          return prev;
        });
      };

      pc.onconnectionstatechange = () => {
        console.log("🔗 État connexion:", pc.connectionState);
        if (pc.connectionState === "connected") {
          setStatus("live");
          console.log("✅ Connexion établie!");
        } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          setStatus("offline");
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("🧊 État ICE:", pc.iceConnectionState);
      };

      pc.onsignalingstatechange = () => {
        console.log("🚦 État signalisation:", pc.signalingState);
      };

      // ⭐ Écouter les négociations
      pc.onnegotiationneeded = async () => {
        console.log("🔄 Négociation nécessaire");
        try {
          if (pc.signalingState === "stable") {
            const offer = await pc.createOffer();
            const cleanSdp = stripAllExtensions(offer.sdp || '');
            await pc.setLocalDescription({ type: offer.type, sdp: cleanSdp });
            if (websocketRef.current?.readyState === WebSocket.OPEN) {
              websocketRef.current.send(JSON.stringify({
                type: "offer",
                sdp: cleanSdp,
                role: isBroadcasterRole ? "broadcaster" : "viewer",
              }));
            }
          }
        } catch (err) {
          console.error("❌ Erreur négociation:", err);
        }
      };

      // WebSocket
      const wsUrl = process.env.NEXT_PUBLIC_SIGNALING_URL || "ws://localhost:8000";
      console.log(`🔌 Connexion WebSocket à ${wsUrl}/ws/${roomId}/${userId}`);
      const ws = new WebSocket(`${wsUrl}/ws/${roomId}/${userId}`);
      websocketRef.current = ws;

      ws.onopen = async () => {
        console.log("✅ WebSocket connecté");
        try {
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          
          const cleanSdp = stripAllExtensions(offer.sdp || '');
          await pc.setLocalDescription({
            type: offer.type,
            sdp: cleanSdp,
          });
          
          ws.send(JSON.stringify({
            type: "offer",
            sdp: cleanSdp,
            role: isBroadcasterRole ? "broadcaster" : "viewer",
          }));
          console.log("📤 Offre envoyée");
        } catch (err) {
          console.error("❌ Erreur offre:", err);
          setError("Erreur de connexion");
        }
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📨 Message reçu:", data.type);
          
          if (data.type === "answer") {
            try {
              if (pc.signalingState === "have-local-offer") {
                const cleanSdp = stripAllExtensions(data.sdp);
                await pc.setRemoteDescription({
                  type: "answer",
                  sdp: cleanSdp,
                });
                console.log("✅ Réponse acceptée");
              } else {
                console.log("⏭️ Ignoré answer (mauvais état):", pc.signalingState);
              }
            } catch (err) {
              console.error("❌ Erreur answer:", err);
            }
          } else if (data.type === "offer") {
            try {
              if (pc.signalingState === "stable") {
                const cleanSdp = stripAllExtensions(data.sdp);
                await pc.setRemoteDescription({
                  type: "offer",
                  sdp: cleanSdp,
                });
                const answer = await pc.createAnswer();
                const cleanAnswer = stripAllExtensions(answer.sdp || '');
                await pc.setLocalDescription({
                  type: answer.type,
                  sdp: cleanAnswer,
                });
                ws.send(JSON.stringify({
                  type: "answer",
                  sdp: cleanAnswer,
                }));
                console.log("✅ Renégociation acceptée");
              } else {
                console.log("⏭️ Ignoré offer (mauvais état):", pc.signalingState);
              }
            } catch (err) {
              console.error("❌ Erreur renégociation:", err);
            }
          } else if (data.type === "peer-left") {
            console.log(`👋 Participant parti: ${data.user_id}`);
            setParticipants(prev => {
              return prev.filter(p => p.id !== data.user_id);
            });
          }
        } catch (err) {
          console.error("❌ Erreur WS:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("❌ Erreur WebSocket:", error);
        setError("Erreur WebSocket");
        setStatus("offline");
      };

      ws.onclose = () => {
        console.log("🔌 WebSocket fermé");
        setStatus("offline");
      };

    } catch (err) {
      console.error("❌ Erreur initialisation:", err);
      setError("Erreur de connexion");
      setStatus("offline");
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = isCameraOff;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  const leaveCall = () => {
    cleanup();
  };

  useEffect(() => {
    return cleanup;
  }, []);

  return {
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
  };
}