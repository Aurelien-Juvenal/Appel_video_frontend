# Liaison — Frontend d'appel vidéo (Next.js)

Interface web pour l'application d'appel vidéo du projet 18/19
(diffusion vidéo en continu), adaptée au web avec WebRTC.

## Démarrage

```bash
npm install
cp .env.local.example .env.local   # configurer l'URL du backend FastAPI
npm run dev
```

Ouvrir http://localhost:3000

## Structure

- `app/page.tsx` — écran d'accueil : créer ou rejoindre un salon
- `app/room/[roomId]/page.tsx` — écran d'appel : grille vidéo, contrôles
- `components/VideoTile.tsx` — une tuile vidéo (locale ou distante)
- `components/ControlBar.tsx` — barre de contrôle (micro, caméra, quitter)
- `components/ConnectionBadge.tsx` — indicateur de statut de connexion
- `lib/useCallRoom.ts` — hook gérant la capture caméra/micro et le
  point d'intégration avec le backend de signalisation (FastAPI) et
  le serveur média (Python + aiortc)

## État actuel

- ✅ Capture caméra/micro (`getUserMedia`)
- ✅ Interface complète (grille vidéo, contrôles, salon, participants)
- ⏳ Connexion WebRTC réelle : le hook `useCallRoom` contient les points
  d'intégration commentés (`TODO`) pour brancher le WebSocket de
  signalisation FastAPI et gérer les `RTCPeerConnection` avec le
  serveur média aiortc.

Sans backend configuré (`NEXT_PUBLIC_SIGNALING_URL` vide), l'app
fonctionne en mode "prévisualisation locale" : vous voyez votre propre
flux caméra, utile pour tester l'interface seule.
