import { createGame, start, tick, catchLight, bank, pause, resume, halfWidth } from './model.mjs';
import { bindPressAction } from './input.mjs';

const $ = selector => document.querySelector(selector);
const state = createGame();
const elements = Object.fromEntries(['score', 'carry', 'time', 'chain', 'next', 'arena', 'pause', 'cover', 'start', 'catch', 'bank', 'bank-value', 'message', 'yuu-line', 'cover-title', 'cover-copy', 'cover-kicker', 'result-detail', 'best'].map(id => [id, document.getElementById(id)]));
let best = 0;
let storageAvailable = true;
try { const saved = Number(localStorage.getItem('yuu-one-more-best-v1')); if (Number.isFinite(saved) && saved >= 0) best = saved; } catch { storageAvailable = false; }
elements.best.textContent = best;
let previous = performance.now();
const point = angle => [180 + Math.sin(angle) * 120, 180 - Math.cos(angle) * 120];

function render() {
  elements.score.textContent = state.score;
  elements.carry.textContent = state.carry;
  elements.time.textContent = Math.ceil(state.remaining);
  elements.chain.innerHTML = `${state.chain}<span> CHAIN</span>`;
  elements.next.textContent = `次は +${10 + state.chain * 5}`;
  elements['bank-value'].textContent = `+${state.carry}`;
  const running = state.phase === 'running';
  elements.arena.disabled = elements.catch.disabled = !running;
  elements.bank.disabled = !running || !state.carry;
  elements.pause.disabled = !['running', 'paused'].includes(state.phase);
  elements.pause.textContent = state.phase === 'paused' ? '再開する' : '一時停止';
  const width = halfWidth(state);
  const a = point(state.target - width), b = point(state.target + width);
  for (const id of ['zone-halo', 'zone']) $( `#${id}`).setAttribute('d', `M ${a[0]} ${a[1]} A 120 120 0 0 1 ${b[0]} ${b[1]}`);
  const star = point(state.target);
  $('#star').setAttribute('transform', `translate(${star[0]} ${star[1]})`);
  const runner = point(state.angle);
  for (const id of ['runner', 'runner-halo']) { $(`#${id}`).setAttribute('cx', runner[0]); $(`#${id}`).setAttribute('cy', runner[1]); }
}

function say(message, line, tone = '') {
  elements.message.textContent = message;
  elements.message.dataset.tone = tone;
  if (line) elements['yuu-line'].textContent = line;
}

function updateClock(now = performance.now()) {
  const wasRunning = state.phase === 'running';
  tick(state, (now - previous) / 1000);
  previous = now;
  if (wasRunning && state.phase === 'finished') finish();
}

function finish() {
  const improved = state.score > best;
  best = Math.max(best, state.score);
  try { localStorage.setItem('yuu-one-more-best-v1', String(best)); } catch { storageAvailable = false; }
  elements.best.textContent = best;
  elements.cover.hidden = false;
  elements['cover-kicker'].textContent = improved ? 'NEW PERSONAL BEST' : '45 SECONDS / FINISH';
  elements['cover-title'].textContent = `${state.score} 点、確保！`;
  elements['cover-copy'].textContent = '最後の手持ちも確保したよ。もう一回、欲張ってみる？';
  elements['result-detail'].textContent = `成功 ${state.hits} 回 / ミス ${state.misses} 回 / 最長 ${state.maxChain} 連続${storageAvailable ? '' : '（最高点は保存できません）'}`;
  elements.start.textContent = 'もう1回、遊ぶ ↗';
  say('おつかれさま。最後の手持ちも得点に追加したよ。', state.score ? '……もう1回やったら、もっといけそう。' : 'まず1コつかまえよう。タイミング、見えてきた？');
  elements.start.focus();
}

function doCatch() {
  updateClock();
  const result = catchLight(state);
  if (!result) return;
  if (result.hit) say(`つかまえた！ +${result.gain} / 手持ち ${state.carry} 点`, state.chain >= 3 ? 'ね、あと1コだけ。たぶん、いける。' : 'お。いまの、ちょっと気持ちいい。');
  else say(result.lost ? `あっ。手持ち ${result.lost} 点を落とした。確保した点は残るよ。` : 'ちょっと早いか遅いかも。ゾーンに光が重なる瞬間を狙おう。', result.lost ? '……今のは欲張った。でも、次はいける。' : 'まずは光を一周、見てみよう。', 'miss');
  render();
}

function doBank() {
  updateClock();
  const gain = bank(state);
  if (gain) say(`${gain} 点を確保！ 速さと連続数をリセット。`, 'よし、これはぼくの点。……じゃなくて、きみの点。');
  render();
}

function setPause(onlyPause = false) {
  updateClock();
  if (state.phase === 'running') {
    pause(state);
    elements.cover.hidden = false;
    elements['cover-kicker'].textContent = 'TAKE A BREATH';
    elements['cover-title'].textContent = 'ちょっと、ひと休み。';
    elements['cover-copy'].textContent = '時間も光も止まっているよ。同じ位置から再開できる。';
    elements['result-detail'].textContent = '';
    elements.start.textContent = '続きから遊ぶ ↗';
    elements.start.focus();
  } else if (state.phase === 'paused' && !onlyPause) begin();
  render();
}

function begin() {
  if (state.phase === 'paused') resume(state);
  else { start(state); say('光がゾーンに重なったら、つかまえる！', 'まず1コ。その先は、つかまえてから考えよう。'); }
  previous = performance.now();
  elements.cover.hidden = true;
  elements['result-detail'].textContent = '';
  render();
  elements.catch.focus();
}

elements.start.addEventListener('click', begin);
bindPressAction(elements.catch, doCatch);
bindPressAction(elements.arena, doCatch);
elements.bank.addEventListener('click', doBank);
elements.pause.addEventListener('click', () => setPause());
document.addEventListener('visibilitychange', () => { if (document.hidden && state.phase === 'running') setPause(true); });
document.addEventListener('keydown', event => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input, textarea, select, summary')) return;
  if (event.code === 'KeyP' && ['running', 'paused'].includes(state.phase)) { event.preventDefault(); setPause(); }
  if (state.phase !== 'running') return;
  if (event.code === 'Space') {
    const button = event.target.closest('button');
    if (button && !['catch', 'arena'].includes(button.id)) return;
    event.preventDefault(); doCatch();
  }
  if (event.code === 'KeyB') { event.preventDefault(); doBank(); }
});

function frame(now) { updateClock(now); render(); requestAnimationFrame(frame); }
render();
requestAnimationFrame(frame);
