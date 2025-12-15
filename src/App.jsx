import { useEffect, useState } from 'react';
import EchoCanvas from './components/EchoCanvas.jsx';
import EntryList from './components/EntryList.jsx';
import EchoStatePanel from './components/EchoStatePanel.jsx';
import { useAmbience } from './hooks/useAmbience.js';
import { useLocalEntries } from './hooks/useLocalEntries.js';
import { useRecorder } from './hooks/useRecorder.js';
import './styles/app.css';

export default function App() {
  const { entries, addEntry, removeEntry, updateEntry, updateEchoState } = useLocalEntries();
  const [input, setInput] = useState('');
  const [active, setActive] = useState(null);
  const [snapshotUrl, setSnapshotUrl] = useState(null);
  const [canvasNode, setCanvasNode] = useState(null);
  const { isActive: sonoOn, start: startSono, stop: stopSono, update: updateSono } = useAmbience();
  const recorder = useRecorder();

  useEffect(() => {
    if (entries.length && !active) {
      setActive(entries[0]);
    }
  }, [entries, active]);

  const submitText = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const entry = addEntry(input.trim());
    setActive(entry);
    setInput('');
    if (sonoOn) {
      updateSono(entry.echoState);
    }
  };

  const handleSnapshot = () => {
    if (!canvasNode) return;
    const url = canvasNode.toDataURL('image/png');
    setSnapshotUrl(url);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'echo-photo.png';
    link.click();
  };

  const handleRecord = () => {
    if (!canvasNode) return;
    if (recorder.recording) {
      recorder.stop();
      return;
    }
    recorder.start(canvasNode, 20000);
  };

  const evolveState = (next) => {
    if (!active) return;
    const merged = { ...active, echoState: next };
    setActive(merged);
    updateEchoState(active.id, next);
    if (sonoOn) updateSono(next);
  };

  const toggleSono = () => {
    if (!active) return;
    if (sonoOn) {
      stopSono();
    } else {
      startSono(active.echoState);
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Flux unique : texte libre → bulle → tags → EchoState → générateurs</p>
          <h1>ÉchoBulle — générateur procédural transmodal</h1>
          <p className="muted">
            Pas d'IA. Un seul état central nourri par la matière textuelle, sensible aux souffles et aux gestes lents.
          </p>
        </div>
        <div className="actions">
          <button className="ghost" onClick={handleSnapshot}>
            EchoPhoto•° (PNG)
          </button>
          <button className="ghost" onClick={handleRecord}>
            {recorder.recording ? 'Arrêter EchoVideo•°' : 'EchoVideo•° (20s)'}
          </button>
          {recorder.downloadUrl && (
            <a className="primary" download="echovideo.webm" href={recorder.downloadUrl}>
              Télécharger
            </a>
          )}
        </div>
      </header>

      <main className="layout">
        <section className="column">
          <form className="panel" onSubmit={submitText}>
            <h2>Texte → bulle</h2>
            <p className="muted">Chaque saisie crée une bulle locale, horodatée. Même texte = même seed.</p>
            <textarea
              placeholder="Dépose ici la matière textuelle, sans commande ni prompt..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
            />
            <button className="primary" type="submit">
              Générer EchoState
            </button>
          </form>

          <div className="panel">
            <h2>EchoSono•°</h2>
            <p className="muted">Nappes WebAudio modulées par densité, flux, tension, entropie, polarité.</p>
            <button className="primary" onClick={toggleSono} disabled={!active}>
              {sonoOn ? 'Couper la nappe' : 'Déployer la nappe'}
            </button>
          </div>

          <EntryList
            entries={entries}
            activeId={active?.id}
            onSelect={(entry) => {
              setActive(entry);
              if (sonoOn) updateSono(entry.echoState);
            }}
            onDelete={removeEntry}
            onUpdate={updateEntry}
            onEvolve={(entry) => {
              setActive(entry);
              if (sonoOn) updateSono(entry.echoState);
            }}
          />
        </section>

        <section className="column wide">
          <EchoStatePanel state={active?.echoState} />
          <div className="panel transparent">
            <div className="panel-header">
              <div>
                <h2>EchoReso•°</h2>
                <p className="muted">Réseau projectif de tags-particules. Souffle et contact modifient l'état.</p>
              </div>
              <div className="inline-actions">
                <span className="chip">{active ? active.echoState.tags.length : 0} tags</span>
                <span className="chip">seed {active?.echoState.seed ?? '—'}</span>
              </div>
            </div>
            {active ? (
              <EchoCanvas
                state={active.echoState}
                onStateEvolve={evolveState}
                onSnapshotReady={setCanvasNode}
              />
            ) : (
              <p className="muted">Saisis un texte pour alimenter l'inconscient algorithmique.</p>
            )}
          </div>

          {snapshotUrl && (
            <div className="panel">
              <h3>EchoPhoto•°</h3>
              <img className="preview" src={snapshotUrl} alt="Capture EchoPhoto" />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
