# ÉchoBulle — bulles organiques locales
Ceci est un prototype frugal et local. Le hublot affiche des bulles issues des imports image/vidéo, perforées et transformées en
petits GIFs circulaires au contour léger. Elles dansent sans se chevaucher, un MP3 boucle et lisse le pulse, un tag à la fois
respire puis s’efface.

## Concept
- Imports image/vidéo convertis en bulles GIF stylisées (perforation, frames réduites, contour seulement).
- Bulles circulaires au contour animé très léger, pas de glow ni d’effets cumulés.
- Physique simple : pas de chevauchement, rebonds amortis, vitesse lente et stable pour emojis, tags et GIFs.
- Emojis attracteurs (🌊 🌙 🔥 🪨 🌫️) centrés, sans clignotement.
- Tags affichés séquentiellement : un seul tag visible, apparition toutes les 4–6 s, fade in/out lent.
- Pulse audio lissé depuis un MP3 local via Web Audio, utilisé partout pour garder un rythme unique.
- Interaction souffle : tap/clic pousse doucement les bulles, jamais de réaction brutale.

## Usage
Ouvre `index.html` dans un navigateur mobile ou desktop (Termux + Acode inclus). Importe un MP3 : la nappe joue en boucle,
le pulse s’adapte. Importe un MP4 ou une image : ils sont perforés et convertis en bulles GIF contourées qui rejoignent la danse sans se chevaucher.
Tap/clic pour souffler. Capture PNG disponible pour sauver un instant. Aucun réseau, aucune IA : tout est local.

> “Ceci est un prototype frugal pour tester le cœur hypnotique d’ÉchoBulle.”
