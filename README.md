# ÉchoBulle — hublot audiovisuel local
Ceci est un prototype frugal pour tester le cœur multimédia d’ÉchoBulle : tout fonctionne hors ligne, sans IA ni cloud.

## Concept
Un hublot circulaire unique, tout en canvas :
- vidéo MP4 dessinée image par image via MediaBunny (résolue via import map locale)
- audio MP3 lu en boucle et analysé (pulse harmonique doux)
- images importées fondues en double exposition (`screen`, `lighter`, etc.)
- particules de tags et d’emojis flottants, influencés par souffle / drag
- mode Éditeur pour figer le flux, sélectionner un élément (vidéo / image / tags / emoji / texte / audio symbolique), le déplacer, le redimensionner, sauvegarder sa position
- capture PNG d’un instantané (capture vidéo 15 s prête à être branchée)

## Usage
Ouvre `index.html` dans un navigateur mobile ou desktop (Termux + Acode inclus). Importer un MP3, un MP4, puis des images.
Taper / glisser dans le hublot pour souffler sur les particules. Bouton Éditer le paysage fige le flux, affiche la liste des sources et permet de déplacer / zoomer un élément au toucher (double tap = reset). Bouton Capture exporte une image.

> “Ceci est un prototype frugal pour tester le cœur multimédia d’ÉchoBulle.”
