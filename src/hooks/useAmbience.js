import { useEffect, useRef, useState } from 'react';
import { clamp } from '../core/seeded.js';

export function useAmbience() {
  const audioRef = useRef(null);
  const nodesRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => () => stop(), []);

  const ensureAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new AudioContext();
    }
    if (audioRef.current.state === 'suspended') {
      audioRef.current.resume();
    }
    return audioRef.current;
  };

  const start = (state) => {
    const ctx = ensureAudio();
    if (nodesRef.current) return;

    const master = ctx.createGain();
    master.gain.value = 0.18;
    master.connect(ctx.destination);

    const noise = ctx.createOscillator();
    noise.type = 'sawtooth';
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.02 + state.entropy * 0.08;
    noise.connect(noiseGain).connect(master);
    noise.start();

    const resonances = [80, 160, 240].map((base, index) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = base + state.density * 45 + index * 12;

      const gain = ctx.createGain();
      gain.gain.value = 0.04 + state.flow * 0.06 + index * 0.02;

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.03 + state.flow * 0.2 + index * 0.05;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 6 + state.tension * 20;
      lfo.connect(lfoGain).connect(osc.frequency);
      lfo.start();

      osc.connect(gain).connect(master);
      osc.start();

      return { osc, lfo, gain };
    });

    nodesRef.current = { master, noise, noiseGain, resonances };
    setIsActive(true);
  };

  const update = (state) => {
    if (!nodesRef.current) return;
    nodesRef.current.noiseGain.gain.value = 0.02 + state.entropy * 0.08;
    nodesRef.current.resonances.forEach(({ osc, lfo, gain }, index) => {
      osc.frequency.value = 80 + state.density * 45 + index * 12 + state.polarity * 20;
      lfo.frequency.value = 0.03 + state.flow * 0.2 + index * 0.05;
      gain.gain.value = 0.04 + clamp(state.flow, 0, 1) * 0.06 + index * 0.02;
    });
  };

  const stop = () => {
    if (!nodesRef.current) return;
    nodesRef.current.resonances.forEach(({ osc, lfo }) => {
      osc.stop();
      lfo.stop();
    });
    nodesRef.current.noise.stop();
    nodesRef.current.master.disconnect();
    audioRef.current.close();
    audioRef.current = null;
    nodesRef.current = null;
    setIsActive(false);
  };

  return { isActive, start, stop, update };
}
