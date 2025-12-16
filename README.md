# ÉchoBulle — bulles calmes et lisibles
Ceci est un prototype frugal et local. Aucun overlay, aucune double exposition : un hublot circulaire affiche quelques bulles emoji
qui dérivent lentement, et un seul tag apparaît à la fois avant de se dissoudre. Un MP3 en boucle nourrit un pulse doux pour
faire respirer l’ensemble.

## Concept
- Bulles circulaires colorées, contour léger, opacité qui fluctue subtilement.
- Physique simple : pas de chevauchement, rebonds amortis, vitesse lente et stable.
- Emojis attracteurs (🌊 🌙 🔥 🪨 🌫️) centrés dans leurs bulles, sans clignotement.
- Tags affichés séquentiellement : un seul tag visible, apparition toutes les 4–6 s, fade in/out lent.
- Pulse audio lissé depuis un MP3 local via Web Audio, utilisé partout pour garder un rythme unique.
- Interaction souffle : tap/clic pousse doucement les bulles, jamais de réaction brutale.

## Usage
Ouvre `index.html` dans un navigateur mobile ou desktop (Termux + Acode inclus). Importe un MP3 : la nappe joue en boucle,
le pulse s’adapte, les bulles se déplacent calmement. Clique ou touche le hublot pour souffler. Capture PNG disponible pour
sauver un instant. Aucun réseau, aucune IA : tout est local.

> “Ceci est un prototype frugal pour tester le cœur hypnotique d’ÉchoBulle.”
