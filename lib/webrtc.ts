/**
 * Utilitaires partagés entre useBroadcastRoom (diffuseur) et
 * useWatchRoom (spectateur) pour la connexion WebRTC au serveur média.
 */

/**
 * Attend que la collecte ICE soit terminée avant d'envoyer l'offre/réponse.
 * Le serveur média (aiortc) n'implémente pas le trickle ICE : il attend
 * une description SDP complète (approche "vanilla ICE").
 */
export function waitForIceGatheringComplete(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    function check() {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", check);
        resolve();
      }
    }
    pc.addEventListener("icegatheringstatechange", check);
  });
}

/** Génère un identifiant unique pour distinguer chaque participant côté serveur. */
export function generateUserId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export type ConnectionStatus = "connecting" | "live" | "offline";

/** Messages que le SERVEUR peut envoyer au client (voir main.py : le
 * serveur ne renégocie jamais après la négociation initiale, donc aucun
 * message de type "offer" n'est envoyé une fois la connexion établie). */
export type SignalingMessage =
  | { type: "answer"; sdp: string }
  | { type: "error"; message: string }
  | { type: "broadcaster-left" }
  | { type: "peer-left"; user_id: string };
