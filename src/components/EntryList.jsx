import { useState } from 'react';
import { toTimestampLabel } from '../utils/textProcessing.js';

export default function EntryList({ entries, onSelect, onDelete, onUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setDraft(entry.text);
  };

  const saveEdit = (entry) => {
    onUpdate(entry.id, draft);
    setEditingId(null);
  };

  return (
    <div className="entry-panel">
      <h2>EchoTexto•°</h2>
      <p className="muted">Chaque texte devient une bulle horodatée, éditable, supprimable.</p>
      <div className="entry-list">
        {entries.map((entry) => (
          <div key={entry.id} className="entry-card">
            {editingId === entry.id ? (
              <>
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} />
                <div className="row">
                  <button className="ghost" onClick={() => setEditingId(null)}>
                    Annuler
                  </button>
                  <button className="primary" onClick={() => saveEdit(entry)}>
                    Enregistrer
                  </button>
                </div>
              </>
            ) : (
              <>
                <header>
                  <span className="timestamp">{toTimestampLabel(entry.createdAt)}</span>
                  <div className="row">
                    <button className="ghost" onClick={() => startEdit(entry)}>
                      Éditer
                    </button>
                    <button className="ghost" onClick={() => onDelete(entry.id)}>
                      Supprimer
                    </button>
                  </div>
                </header>
                <p className="text">{entry.text}</p>
                <div className="tags">
                  {entry.tags.map((tag) => (
                    <span key={tag.id}>{tag.label}</span>
                  ))}
                </div>
                <button className="primary slim" onClick={() => onSelect(entry)}>
                  Résonner avec cette bulle
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
