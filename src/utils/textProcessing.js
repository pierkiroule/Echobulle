const STOP_WORDS = new Set([
  'alors', 'au', 'aucuns', 'aussi', 'autre', 'avant', 'avec', 'avoir', 'bon', 'car',
  'ce', 'cela', 'ces', 'ceux', 'chaque', 'ci', 'comme', 'comment', 'dans', 'des',
  'du', 'dedans', 'dehors', 'depuis', 'deux', 'devrait', 'doit', 'donc', 'dos', 'droite',
  'début', 'elle', 'elles', 'en', 'encore', 'essai', 'est', 'et', 'eu', 'fait', 'faites',
  'fois', 'font', 'force', 'haut', 'hors', 'ici', 'il', 'ils', 'je', 'juste', 'la', 'le',
  'les', 'leur', 'là', 'ma', 'maintenant', 'mais', 'mes', 'mine', 'moins', 'mon', 'mot',
  'même', 'ni', 'nommés', 'notre', 'nous', 'nouveaux', 'ou', 'où', 'par', 'parce', 'parole',
  'pas', 'personnes', 'peu', 'peut', 'plupart', 'pour', 'pourquoi', 'quand', 'que', 'quel',
  'quelle', 'quelles', 'quels', 'qui', 'sa', 'sans', 'se', 'ses', 'seulement', 'si', 'sien',
  'son', 'sont', 'sous', 'soyez', 'sujet', 'sur', 'ta', 'tandis', 'tellement', 'tels', 'tes',
  'ton', 'tous', 'tout', 'trop', 'très', 'tu', 'valeur', 'voie', 'voient', 'vont', 'votre',
  'vous', 'vu', 'ça', 'étaient', 'état', 'étions', 'été', 'être',
]);

const palettes = ['#89f0ff', '#f5d0c5', '#9ec5a1', '#c0b0f3', '#f0e68c'];

export function extractTags(text) {
  const tokens = text
    .toLowerCase()
    .split(/[^a-zàâçéèêëîïôûùüÿñæœ'-]+/i)
    .filter((token) => token && token.length > 2 && !STOP_WORDS.has(token));

  const counts = new Map();
  tokens.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const desired = Math.min(12, Math.max(5, sorted.length));

  const tags = sorted.slice(0, desired).map(([label], index) => {
    const base = 0.8 + Math.random() * 0.6;
    return {
      id: `${label}-${index}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      weight: counts.get(label),
      mass: base,
      energy: 0.5 + Math.random() * 0.7,
      color: palettes[index % palettes.length],
    };
  });

  return tags;
}

export function toTimestampLabel(dateString) {
  const d = new Date(dateString);
  return d.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}
