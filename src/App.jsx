import { useEffect, useRef, useState } from 'react';
import EchoCanvas from './components/EchoCanvas.jsx';
import EntryList from './components/EntryList.jsx';
import { useAmbience } from './hooks/useAmbience.js';
import { useLocalEntries } from './hooks/useLocalEntries.js';
import { useRecorder } from './hooks/useRecorder.js';
import './styles/app.css';

export default function App() {
  const { entries, addEntry, removeEntry, updateEntry } = useLocalEntries();
  const [active, setActive] = useState(null);
  const [input, setInput] = useState('');
  const [metrics, setMetrics] = useState({ avgSpeed: 0, density: 0 });
  const [snapshotUrl, setSnapshotUrl] = useState(null);
  const [canvasRef, setCanvasRef] = useState(null);
  const { isActive: audioOn, toggleAmbience } = useAmbience();
  const recorder = useRecorder();
  const cleanupAudio = useRef(null);

  useEffect(() => {
    setActive(entries[0]);
  }, [entries]);

  const submitText = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const entry = addEntry(input.trim());
    setActive(entry);
    setInput('');
  };

  const handleSnapshot = () => {
    if (!canvasRef) return;
    const url = canvasRef.toDataURL('image/png');
    setSnapshotUrl(url);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'echobulle.png';
    link.click();
  };

  const handleRecord = () => {
    if (!canvasRef) return;
    if (recorder.recording) {
      recorder.stop();
      return;
    }
    recorder.start(canvasRef, 15000);
  };

  useEffect(() => {
    if (cleanupAudio.current) {
      cleanupAudio.current();
      cleanupAudio.current = null;
    }
    if (audioOn) {
      cleanupAudio.current = toggleAmbience(metrics);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics]);

  const handleAudioToggle = () => {
    if (cleanupAudio.current) {
      cleanupAudio.current();
      cleanupAudio.current = null;
      return;
    }
    cleanupAudio.current = toggleAmbience(metrics);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">PROMPT LOVABLE — PROJET ÉchoBulle</p>
          <h1>ÉchoBulle — Inconscient algorithmique</h1>
          <p className="muted">
            Texte → Bulle → Tags → Réseau. Écoute lente, dérive des particules, fusion en pictogrammes.
          </p>
        </div>
        <div className="actions">
          <button className="ghost" onClick={handleSnapshot}>
            Cristalliser (PNG)
          </button>
          <button className="ghost" onClick={handleRecord}>
            {recorder.recording ? 'Arrêter capture' : 'EchoVideo•° (15s)'}
          </button>
          {recorder.downloadUrl && (
            <a className="primary" download="echobulle.webm" href={recorder.downloadUrl}>
              Télécharger la capture
            </a>
          )}
        </div>
      </header>

      <main className="layout">
        <section className="column">
          <form className="panel" onSubmit={submitText}>
            <h2>Nouveau texte</h2>
            <p className="muted">Pas d’IA. Juste tes mots, stockés localement.</p>
            <textarea
              placeholder="Dépose ici une matière textuelle..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
            />
            <button className="primary" type="submit">
              Créer une bulle
            </button>
          </form>

          <div className="panel">
            <h2>EchoSono•°</h2>
            <p className="muted">
              Sons procéduraux lents. Pas de mélodie. Modulation par densité et vitesse moyenne du réseau.
            </p>
            <button className="primary" onClick={handleAudioToggle}>
              {cleanupAudio.current ? 'Couper' : 'Déployer la nappe sonore'}
            </button>
            <div className="stats">
              <div>
                <span className="muted">Densité</span>
                <strong>{metrics.density.toFixed(2)}</strong>
              </div>
              <div>
                <span className="muted">Vitesse moyenne</span>
                <strong>{metrics.avgSpeed.toFixed(3)}</strong>
              </div>
            </div>
          </div>

          <EntryList
            entries={entries}
            onSelect={setActive}
            onDelete={removeEntry}
            onUpdate={updateEntry}
          />
        </section>

        <section className="column wide">
          <div className="panel transparent">
            <div className="panel-header">
              <div>
                <h2>EchoReso•°</h2>
                <p className="muted">Réseau vivant de tags-particules, attiré par des pôles symboliques.</p>
              </div>
              <div className="inline-actions">
                <span className="chip">{active ? active.tags.length : 0} tags</span>
                <span className="chip">Interaction = souffle</span>
              </div>
            </div>
            <EchoCanvas
              tags={active?.tags ?? []}
              onMetrics={setMetrics}
              onSnapshotReady={setCanvasRef}
            />
          </div>
          {snapshotUrl && (
            <div className="panel">
              <h3>EchoPhoto•°</h3>
              <img className="preview" src={snapshotUrl} alt="Capture ÉchoBulle" />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
