import { createBubblesEngine } from './bubbles.js';

// The video import path now perforates MP4/WEBM sources into animated GIF-like bubbles.
export function createVideoEngine(state) {
  return createBubblesEngine(state);
}
