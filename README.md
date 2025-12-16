# ÉchoBulle — POC transmédia local

Ceci est un prototype frugal pour tester le cœur multimédia d’ÉchoBulle.
Objectif V1 : vérifier que l’audio MP3 et la vidéo MP4 tournent ensemble, en boucle, sans dépendance externe.

Mode d’emploi :
1. Ouvre `index.html` dans un navigateur mobile ou desktop.
2. Clique sur « Importer MP3 » puis « Importer MP4 » (fichiers locaux).
3. Les deux médias jouent en boucle dans le hublot circulaire. Le bouton « Stop / Reset » remet à zéro.
4. Si un média manque, le hublot reste silencieux ou noir. Aucune IA, aucun réseau, aucun backend.
5. L’export/capture sera branché plus tard : le code expose déjà les moteurs audio/vidéo pour y accrocher une capture locale.
