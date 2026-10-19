import { getRecords, clearRecords, bestScore } from './Storage.js';

export default class UI {
  constructor(game) {
    this.game = game;
    this.screens = {
      menu: document.querySelector('#menuScreen'),
      pause: document.querySelector('#pauseScreen'),
      over: document.querySelector('#overScreen'),
      records: document.querySelector('#recordsScreen'),
      portrait: document.querySelector('#portraitScreen'),
    };
    this.hud = document.querySelector('#hud');
    this.orientationHint = document.querySelector('#orientationHint');
    this.soundButton = document.querySelector('#soundButton');

    this.bind('startButton', () => game.begin());
    this.bind('recordsButton', () => this.showRecords());
    this.bind('quitButton', () => this.show('menu'));
    this.bind('pauseButton', () => game.pause());
    this.bind('exitButton', () => game.exit());
    this.bind('resumeButton', () => game.resume());
    this.bind('restartButton', () => game.begin());
    this.bind('pauseMenuButton', () => game.exit());
    this.bind('againButton', () => game.begin());
    this.bind('overMenuButton', () => game.exit());
    this.bind('recordsBackButton', () => this.show('menu'));
    this.bind('clearRecordsButton', () => {
      if (confirm('Точно очистить все сохранённые рекорды?')) {
        clearRecords();
        this.renderRecords();
      }
    });
    this.bind('portraitContinue', () => {
      this.screens.portrait.hidden = true;
      this.show('menu');
    });
    this.bind('soundButton', () => {
      const enabled = game.audio.toggle();
      this.soundButton.textContent = `♫ ЗВУК: ${enabled ? 'ВКЛ' : 'ВЫКЛ'}`;
      this.soundButton.setAttribute('aria-label', enabled ? 'Выключить звук' : 'Включить звук');
    });
    this.refreshMenu();
  }

  bind(id, callback) {
    document.getElementById(id).addEventListener('click', callback);
  }

  show(name) {
    Object.entries(this.screens).forEach(([key, element]) => {
      element.hidden = key !== name;
    });
    this.hud.hidden = name !== 'game';
    this.orientationHint.hidden = !(
      name === 'game' && window.matchMedia('(orientation: portrait) and (max-width: 700px)').matches
    );
    this.refreshMenu();
  }

  showRecords() {
    this.renderRecords();
    this.show('records');
  }

  refreshMenu() {
    document.querySelector('#menuBest').textContent = bestScore();
  }

  updateHud(game) {
    document.querySelector('#scoreValue').textContent = game.score;
    document.querySelector('#lives').textContent = '♥ '.repeat(game.lives).trim() || '—';
    document.querySelector('#multiplier').hidden = game.bonusTime <= 0;
    document.querySelector('#bonusTimer').textContent = game.bonusTime.toFixed(1);
  }

  showOver(score, best, isBest) {
    this.show('over');
    document.querySelector('#finalScore').textContent = score;
    document.querySelector('#finalBest').textContent = best;
    document.querySelector('#newRecord').hidden = !isBest;
    document.querySelector('#overTitle').textContent = score >= 500 ? 'ВОТ ЭТО ВЗМАХ!' : 'ХОРОШИЙ ВЗМАХ!';
  }

  renderRecords() {
    const list = document.querySelector('#recordList');
    list.replaceChildren();
    const records = getRecords();
    document.querySelector('#recordsEmpty').hidden = records.length > 0;

    records.forEach((record, index) => {
      const item = document.createElement('li');
      const rank = document.createElement('span');
      const info = document.createElement('span');
      const date = document.createElement('span');
      const points = document.createElement('b');

      rank.textContent = String(index + 1).padStart(2, '0');
      date.className = 'record-date';
      const parsedDate = new Date(record.date);
      date.textContent = Number.isNaN(parsedDate.getTime())
        ? 'Дата неизвестна'
        : parsedDate.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
      info.append(document.createTextNode('РАУНД'), date);
      points.className = 'record-points';
      points.textContent = record.score;
      item.append(rank, info, points);
      list.append(item);
    });
  }
}
