import { RacingGame } from './game.js';

const game = new RacingGame(document.getElementById('game-canvas'));
game.loop();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW registration failed', e));
}
