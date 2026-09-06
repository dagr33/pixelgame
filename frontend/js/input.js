// Keyboard + touch input, exposed as simple named actions the game can poll.

const Input = (() => {
  const keys = new Set();

  const KEY_ACTIONS = {
    ArrowLeft: 'left',
    a: 'left',
    A: 'left',
    ArrowRight: 'right',
    d: 'right',
    D: 'right',
    ' ': 'fire',
    p: 'pause',
    P: 'pause',
  };

  const PREVENT_DEFAULT_KEYS = new Set(['ArrowLeft', 'ArrowRight', ' ']);

  window.addEventListener('keydown', (e) => {
    const action = KEY_ACTIONS[e.key];
    if (!action) return;
    if (PREVENT_DEFAULT_KEYS.has(e.key)) e.preventDefault();
    keys.add(action);
  });

  window.addEventListener('keyup', (e) => {
    const action = KEY_ACTIONS[e.key];
    if (action) keys.delete(action);
  });

  window.addEventListener('blur', () => keys.clear());

  function bindTouchButton(el, action) {
    if (!el) return;
    const press = (e) => {
      e.preventDefault();
      keys.add(action);
    };
    const release = (e) => {
      e.preventDefault();
      keys.delete(action);
    };
    el.addEventListener('touchstart', press, { passive: false });
    el.addEventListener('touchend', release, { passive: false });
    el.addEventListener('touchcancel', release, { passive: false });
    el.addEventListener('mousedown', press);
    el.addEventListener('mouseup', release);
    el.addEventListener('mouseleave', release);
  }

  function isDown(action) {
    return keys.has(action);
  }

  function consumePause() {
    if (keys.has('pause')) {
      keys.delete('pause');
      return true;
    }
    return false;
  }

  function reset() {
    keys.clear();
  }

  return {
    isDown, bindTouchButton, consumePause, reset,
  };
})();
