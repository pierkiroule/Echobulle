import { useEffect, useState } from 'react';
import { buildEchoState } from '../core/echoState.js';

const STORAGE_KEY = 'echobulle:entries';

const demoSeeds = [
  'Lenteur profonde, souffle lié à la marée, scintillements stables et mats.',
  'Veille au ralenti, grains d eau suspendus, champ vibratoire discret.',
  'Bruits filtrés comme des algues, tension douce et polarité pastel.',
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
      prev.map((item) => (item.id === id ? { ...item, text, echoState: buildEchoState(text, item.echoState.timestamp) } : item)),
    );
  };

  const removeEntry = (id) => {
    setEntries((prev) => prev.filter((item) => item.id !== id));
  };

  const updateEchoState = (id, nextState) => {
    setEntries((prev) => prev.map((item) => (item.id === id ? { ...item, echoState: nextState } : item)));
  };

  return { entries, addEntry, updateEntry, removeEntry, updateEchoState };
}

function buildEntry(text) {
  const now = new Date().toISOString();
  const echoState = buildEchoState(text, now);
  return {
    id: `bulle-${echoState.seed}-${now}`,
    text,
    createdAt: now,
    echoState,
  };
}
