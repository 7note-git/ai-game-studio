export const TAU = Math.PI * 2;
export const DURATION = 45;
export const normalize = angle => ((angle % TAU) + TAU) % TAU;
export const distance = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
export const speed = state => 1.8 + Math.min(state.chain, 8) * 0.16;
export const halfWidth = state => Math.max(0.20, 0.34 - state.chain * 0.018);

export function createGame() {
  return { phase: 'ready', remaining: DURATION, angle: 0, target: Math.PI / 2,
    chain: 0, maxChain: 0, carry: 0, score: 0, hits: 0, misses: 0 };
}

export function start(state) {
  Object.assign(state, createGame(), { phase: 'running' });
}

export function tick(state, seconds) {
  if (state.phase !== 'running' || !Number.isFinite(seconds) || seconds <= 0) return;
  const elapsed = Math.min(seconds, state.remaining);
  state.angle = normalize(state.angle + speed(state) * elapsed);
  state.remaining = Math.max(0, state.remaining - elapsed);
  if (state.remaining === 0) {
    state.score += state.carry;
    state.carry = 0;
    state.phase = 'finished';
  }
}

function nextTarget(state, random) {
  state.target = normalize(state.angle + 1.6 + random() * 2.8);
}

export function catchLight(state, random = Math.random) {
  if (state.phase !== 'running') return null;
  if (distance(state.angle, state.target) <= halfWidth(state)) {
    state.chain++;
    const gain = 10 + (state.chain - 1) * 5;
    state.carry += gain;
    state.hits++;
    state.maxChain = Math.max(state.maxChain, state.chain);
    nextTarget(state, random);
    return { hit: true, gain };
  }
  const lost = state.carry;
  state.carry = 0;
  state.chain = 0;
  state.misses++;
  nextTarget(state, random);
  return { hit: false, lost };
}

export function bank(state, random = Math.random) {
  if (state.phase !== 'running' || !state.carry) return 0;
  const gain = state.carry;
  state.score += gain;
  state.carry = 0;
  state.chain = 0;
  nextTarget(state, random);
  return gain;
}

export function pause(state) {
  if (state.phase === 'running') state.phase = 'paused';
}
export function resume(state) {
  if (state.phase === 'paused') state.phase = 'running';
}
