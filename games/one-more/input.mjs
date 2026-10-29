// Timing actions run on contact, not release. Keep keyboard/assistive click support.
export function bindPressAction(element, action) {
  element.addEventListener('pointerdown', event => {
    if (element.disabled || event.button !== 0 || event.isPrimary === false) return;
    event.preventDefault();
    element.focus({ preventScroll: true });
    action();
  });
  element.addEventListener('click', event => {
    // Pointer clicks arrive after pointerup. Do not count the same press twice.
    if (element.disabled || event.detail !== 0 || event.pointerType) return;
    action();
  });
}
