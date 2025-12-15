# ÉchoBulle

Dispositif génératif local : texte libre → bulle → tags → **EchoState** → rendus transmodaux (EchoReso, EchoPhoto, EchoVideo, EchoSono). Aucune IA, aucun backend.

## Démarrer

```bash
npm install
npm run dev
```

## Architecture
- `src/core/echoState.js` : dérive un EchoState déterministe depuis le texte (seed stable, tags pondérés, densité/flux/tension/entropie/polarité).
- `src/components/EchoCanvas.jsx` : EchoReso•°, réseau de particules influencé par le souffle/contact, modifiant l'EchoState.
- `src/hooks/useAmbience.js` : EchoSono•°, nappes WebAudio modulées par l'état (sans IA ni API).
- `src/hooks/useRecorder.js` : EchoVideo•° via MediaRecorder ; capture PNG via le canvas.
- `src/hooks/useLocalEntries.js` : mémoire locale (localStorage), horodatage, rejouabilité d'une bulle.

## Flux central
Texte libre → Bulle → Extraction de tags → EchoState (unique et central) → Générateurs transmodaux :
- **EchoPhoto•°** : export PNG du canvas.
- **EchoVideo•°** : capture WebM/MP4 via MediaRecorder.
- **EchoSono•°** : nappes sonores procédurales (WebAudio) mappées sur densité/flux/tension/entropie/polarité.

L'utilisateur n'ordonne pas : il influence par le souffle (drag), le toucher (clic), la lenteur. Emojis absents du cœur : uniquement symboles secondaires si besoin.
