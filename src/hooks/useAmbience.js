import { useEffect, useRef, useState } from 'react';

export function useAmbience() {
  const audioRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.close();
      }
    };
  }, []);

  const ensureAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new AudioContext();
    }
    if (audioRef.current.state === 'suspended') {
      audioRef.current.resume();
    }
    return audioRef.current;
  };

  const toggleAmbience = (metrics) => {
    const ctx = ensureAudio();
    if (isActive) {
      ctx.close();
      audioRef.current = null;
      setIsActive(false);
      return;
    }
    const master = ctx.createGain();
    master.gain.value = 0.12;
    master.connect(ctx.destination);

    const { density = 0.4, speed = 0.2 } = metrics || {};
    const oscillators = Array.from({ length: 3 }, (_, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const baseFreq = 40 + index * 15 + density * 30;
      osc.type = 'sine';
      osc.frequency.value = baseFreq;

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.03 + speed * 0.1 + index * 0.02;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 15 + density * 40;
      lfo.connect(lfoGain).connect(osc.frequency);
      lfo.start();

      gain.gain.value = 0.08 + (index * 0.04 + speed * 0.05);
      osc.connect(gain).connect(master);
      osc.start();
      return { osc, gain, lfo };
    });

    setIsActive(true);

    return () => {
      oscillators.forEach(({ osc, lfo }) => {
        osc.stop();
        lfo.stop();
      });
      ctx.close();
      audioRef.current = null;
      setIsActive(false);
    };
  };

  return { isActive, toggleAmbience };
}
