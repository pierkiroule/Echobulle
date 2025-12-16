# ÉchoBulle — collage de bulles vidéo vivantes
Ceci est un prototype frugal et local. Le champ occupe tout l’écran et ne garde que des bulles GIF issues des vidéos importées : perforées, stylisées, collision-sûres et contourées. Chaque bulle provient d’une source vidéo différente, dérive en douceur sans chevauchement, et les particules périphériques suivent des champs de force audio-réactifs.

## Concept
- Bouton « Importer vidéos » : chaque MP4/WebM est perforé en fragments, compressé en GIFs circulaires contourés, puis injecté dans le collage sans jamais afficher la source brute.
- Toutes les bulles coexistent et dansent lentement : collisions souples, contours sobres, aucune double exposition.
- Emojis alignés sous la ligne de hashtags (hors champ). Hashtags issus du pad texte via « l’écho des # ».
- Bouton « Importer MP3 » : la nappe en boucle nourrit le pulse qui module bulles et particules de force-field ; tap/clic ajoute un souffle doux.
- Canvas plein écran (pas de hublot) avec capture PNG locale. Zéro réseau, zéro IA.

## Usage
Ouvre `index.html` dans un navigateur mobile ou desktop (Termux + Acode inclus).
1. Écris tes pensées puis clique « l’écho des # » : hashtags affichés, emojis alignés juste dessous.
2. Importe un MP3 : l’audio tourne en boucle, pulse lissé appliqué à la scène.
3. Importe une ou plusieurs vidéos : chaque source devient une bulle GIF dédiée, jamais recouverte par les autres.
4. Observe le flux : bulles non chevauchantes, particules audio-réactives, interactions tactiles pour souffler. Capture PNG disponible.

> “Ceci est un prototype frugal pour tester le collage hypnotique d’ÉchoBulle.”
