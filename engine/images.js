import {
  createBubblesEngine,
  perforateSource,
  extractFragments,
  stylizeFragment,
  generateGifBubble,
} from './bubbles.js';

// Legacy entry kept for callers expecting an "images" engine; under V3 the
// imported sources are perforated and reborn as GIF bubbles.
export function createImagesEngine(state) {
  return createBubblesEngine(state);
}

export { perforateSource, extractFragments, stylizeFragment, generateGifBubble };
