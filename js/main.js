import Game from './Game.js';
import UI from './UI.js';

const canvas = document.querySelector('#gameCanvas');
const game = new Game(canvas, null);
const ui = new UI(game);
game.ui = ui;

window.addEventListener('pagehide', () => game.destroy(), { once: true });
