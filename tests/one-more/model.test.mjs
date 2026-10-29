import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, start, tick, catchLight, bank, pause, resume, TAU, distance, halfWidth, speed } from '../../games/one-more/model.mjs';

const running = () => { const state = createGame(); start(state); return state; };
const hit = state => { state.angle = state.target; return catchLight(state, () => .5); };

test('0度をまたぐゾーンと両端で成功を判定する', () => {
  const state = running(); state.target = .02; state.angle = TAU - .02;
  assert.ok(distance(state.angle, state.target) < .05);
  assert.equal(catchLight(state, () => 0).hit, true);
  state.angle = state.target + halfWidth(state) - .00001;
  assert.equal(catchLight(state, () => 0).hit, true);
  state.angle = state.target + halfWidth(state) + .00001;
  assert.equal(catchLight(state).hit, false);
});
test('連続成功の加点と速度・狭さ、確保によるリセット', () => {
  const state = running(); const initialSpeed = speed(state), initialWidth = halfWidth(state);
  hit(state); hit(state); hit(state);
  assert.equal(state.carry, 45); assert.equal(state.score, 0);
  assert.ok(speed(state) > initialSpeed); assert.ok(halfWidth(state) < initialWidth);
  assert.equal(bank(state, () => .5), 45);
  assert.equal(state.score, 45); assert.equal(state.carry, 0); assert.equal(state.chain, 0);
  assert.equal(state.maxChain, 3); assert.equal(speed(state), initialSpeed);
});
test('失敗で手持ちだけ失い、確保済みの点を守る', () => {
  const state = running(); hit(state); bank(state, () => .5); hit(state); hit(state);
  state.angle = state.target + Math.PI;
  assert.equal(catchLight(state, () => 0).lost, 25);
  assert.equal(state.score, 10); assert.equal(state.carry, 0); assert.equal(state.chain, 0);
  assert.equal(state.misses, 1); assert.equal(bank(state), 0);
});
test('一時停止中は時間・角度・得点が変わらず再開できる', () => {
  const state = running(); hit(state); pause(state); const snapshot = structuredClone(state);
  tick(state, 120); assert.equal(catchLight(state), null); assert.equal(bank(state), 0);
  assert.deepEqual(state, snapshot);
  resume(state); tick(state, 1); assert.equal(state.remaining, 44);
});
test('時間切れで手持ちを一度だけ確保し、以後の操作を無効にする', () => {
  const state = running(); hit(state); hit(state); tick(state, 100);
  assert.equal(state.phase, 'finished'); assert.equal(state.remaining, 0);
  assert.equal(state.score, 25); assert.equal(state.carry, 0);
  tick(state, 100); assert.equal(catchLight(state), null); assert.equal(bank(state), 0);
  assert.equal(state.score, 25);
  start(state); assert.deepEqual(state, running());
});
test('遅いフレームでも実際に経過した秒数を消費する', () => {
  const state = running(); tick(state, 12.5);
  assert.equal(state.remaining, 32.5); assert.ok(state.angle >= 0 && state.angle < TAU);
  const snapshot = structuredClone(state); tick(state, NaN); tick(state, -1);
  assert.deepEqual(state, snapshot);
});
