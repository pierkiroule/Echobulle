import { useEffect, useState } from 'react';
import { extractTags } from '../utils/textProcessing.js';

const STORAGE_KEY = 'echobulle:entries';

const demoSeeds = [
  'Lenteur profonde comme une marée noire, respirations alignées sur le ciel.',
  'Murmures d’algues et étincelles cyan, un souffle de givre sur les paupières.',
  'Des pierres chaudes roulent sous la peau, patience cosmique et pulsation basse.',
];

export function useLocalEntries() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setEntries(JSON.parse(stored));
      return;
    }
    const seeded = demoSeeds.map((text) => buildEntry(text));
    setEntries(seeded);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const addEntry = (text) => {
    const entry = buildEntry(text);
    setEntries((prev) => [entry, ...prev]);
    return entry;
  };

  const updateEntry = (id, text) => {
    setEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text, tags: extractTags(text) } : item)),
    );
  };

  const removeEntry = (id) => {
    setEntries((prev) => prev.filter((item) => item.id !== id));
  };

  return { entries, addEntry, updateEntry, removeEntry };
}

function buildEntry(text) {
  const now = new Date().toISOString();
  return {
    id: `entry-${now}-${Math.random().toString(36).slice(2, 6)}`,
    text,
    createdAt: now,
    tags: extractTags(text),
  };
}
