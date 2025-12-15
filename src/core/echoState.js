import { clamp, hashText, mulberry32 } from './seeded.js';

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

const palettes = ['#9bd6f2', '#f2c6de', '#a7e0b1', '#c7c1f5', '#f2e6a7'];

export function buildEchoState(text, timestamp = new Date().toISOString()) {
  const seed = hashText(text);
  const rand = mulberry32(seed);
  const tokens = tokenize(text);
  const tags = deriveTags(tokens, rand);

  const density = clamp(tags.length / 14, 0, 1);
  const flow = clamp(computeFlow(tokens, rand), 0, 1);
  const tension = clamp(computeTension(text, flow, rand), 0, 1);
  const entropy = clamp(computeEntropy(tokens, rand), 0, 1);
  const polarity = clamp(computePolarity(text), -1, 1);

  return {
    seed,
    tags,
    density,
    flow,
    tension,
    entropy,
    polarity,
    timestamp,
  };
}

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-zàâçéèêëîïôûùüÿñæœ'-]+/i)
    .filter((token) => token && token.length > 2 && !STOP_WORDS.has(token));
}

function deriveTags(tokens, rand) {
  const counts = new Map();
  tokens.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const desired = Math.min(14, Math.max(6, sorted.length));

  return sorted.slice(0, desired).map(([label], index) => {
    const base = 0.6 + rand() * 0.6;
    return {
      id: `${label}-${index}`,
      label,
      weight: counts.get(label),
      mass: base,
      energy: 0.4 + rand() * 0.8,
      color: palettes[index % palettes.length],
    };
  });
}

function computeFlow(tokens, rand) {
  const vowelRatio = computeVowelRatio(tokens.join(''));
  return clamp(vowelRatio * 0.6 + rand() * 0.25 + 0.1, 0, 1);
}

function computeTension(text, flow, rand) {
  const punctuation = (text.match(/[!?;,]/g) || []).length;
  const lengthFactor = clamp(text.length / 320, 0, 1);
  return clamp(0.2 + lengthFactor * 0.5 + punctuation * 0.02 + (1 - flow) * 0.4 + rand() * 0.08, 0, 1);
}

function computeEntropy(tokens, rand) {
  if (tokens.length === 0) return 0;
  const unique = new Set(tokens).size;
  const repetition = 1 - unique / tokens.length;
  return clamp(0.3 + repetition * 0.4 + rand() * 0.2, 0, 1);
}

function computePolarity(text) {
  const chars = text.toLowerCase().replace(/[^a-zàâçéèêëîïôûùüÿñæœ]/gi, '');
  if (chars.length === 0) return 0;
  const vowels = chars.match(/[aeiouyàâäéèêëïîôöùûüÿ]/gi)?.length || 0;
  const consonants = chars.length - vowels;
  return clamp((vowels - consonants) / chars.length, -1, 1);
}

function computeVowelRatio(text) {
  if (!text) return 0;
  const vowels = text.match(/[aeiouyàâäéèêëïîôöùûüÿ]/gi)?.length || 0;
  return vowels / text.length;
}
