# ÉchoBulle — bulles vidéo locales
Ceci est un prototype frugal et local. Le hublot n’affiche que des bulles issues des vidéos importées : perforées, stylisées, converties en GIFs contourés. Elles se relaient automatiquement toutes les 10 secondes avec un fondu noir étoilé. Les emojis résonnent sous la ligne de hashtags, jamais dans le hublot. Un MP3 boucle nourrit le pulse qui guide la danse.

## Concept
- Imports vidéo (mp4/webm) convertis en bulles GIF stylisées (perforation, frames réduites, contour léger) via un bouton « Importer vidéos ».
- Bulles circulaires au contour animé très léger, pas de glow ni d’effets cumulés. Pas de chevauchement.
- Séquence auto : chaque vidéo prend le relais pendant ~10 s avec fondu noir étoilé.
- Emojis (🌊 🌙 🔥 🪨 🌫️ 🌬️ ✨ 💧) affichés sous la ligne de hashtags ; le hublot n’affiche que les bulles vidéo.
- Hashtags : un pad texte, bouton « l’écho des # », hashtags affichés sous le bouton, emojis alignés juste en dessous.
- Pulse audio lissé depuis un MP3 local via Web Audio, utilisé partout pour garder un rythme unique.
- Interaction souffle : tap/clic pousse doucement les bulles, jamais de réaction brutale.
- Zone de texte au-dessus du hublot : écris, clique « l’écho des # » pour pulvériser en hashtags (affichés sous le bouton), les emojis du hublot se calent dessus.

## Usage
Ouvre `index.html` dans un navigateur mobile ou desktop (Termux + Acode inclus). Importe un MP3 : la nappe joue en boucle, le pulse s’adapte. Écris des pensées puis déclenche « l’écho des # » : les hashtags apparaissent sous le bouton, la ligne d’emojis suit. Importe une ou plusieurs vidéos : chaque source est perforée et convertie en bulles GIF contourées, diffusées à tour de rôle avec fondu noir étoilé.
Tap/clic pour souffler : les bulles rebondissent sans se chevaucher, un halo de particules audio-réactif entoure le hublot. Capture PNG disponible. Aucun réseau, aucune IA : tout est local.

> “Ceci est un prototype frugal pour tester le cœur hypnotique d’ÉchoBulle.”
