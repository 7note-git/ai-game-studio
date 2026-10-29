import test from 'node:test';
import assert from 'node:assert/strict';
import { bindPressAction } from '../../games/one-more/input.mjs';
import { createGame, start, catchLight } from '../../games/one-more/model.mjs';

class Button extends EventTarget {
  disabled = false;
  focus() {}
}
function send(button, type, properties) {
  const event = new Event(type, { cancelable: true });
  Object.assign(event, properties);
  button.dispatchEvent(event);
  return event;
}

for (const pointerType of ['touch', 'mouse', 'pen']) {
  test(`${pointerType}: 押している間に成功し、離すまで待たず、離しても二重判定しない`, () => {
    const button = new Button(); const state = createGame(); start(state);
    state.angle = state.target;
    bindPressAction(button, () => catchLight(state, () => .5));
    const press = send(button, 'pointerdown', { button: 0, isPrimary: true, pointerType });
    assert.equal(state.hits, 1); assert.equal(state.carry, 10);
    assert.equal(press.defaultPrevented, true);
    state.angle = state.target + Math.PI;
    send(button, 'pointerup', { button: 0, isPrimary: true, pointerType });
    send(button, 'click', { detail: 1, pointerType });
    send(button, 'click', { detail: 0, pointerType });
    assert.equal(state.hits, 1); assert.equal(state.misses, 0); assert.equal(state.carry, 10);
  });
}
test('右クリック・追加の指・無効なボタンは入力しない', () => {
  const button = new Button(); let calls = 0;
  bindPressAction(button, () => calls++);
  send(button, 'pointerdown', { button: 2, isPrimary: true });
  send(button, 'pointerdown', { button: 0, isPrimary: false });
  button.disabled = true;
  send(button, 'pointerdown', { button: 0, isPrimary: true });
  send(button, 'click', { detail: 0 });
  assert.equal(calls, 0);
});
test('キーボード・支援技術の非ポインターclickは使える', () => {
  const button = new Button(); let calls = 0;
  bindPressAction(button, () => calls++);
  send(button, 'click', { detail: 0, pointerType: '' });
  assert.equal(calls, 1);
});
