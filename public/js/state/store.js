/**
 * Minimal observable store: `setState` shallow-merges and notifies subscribers
 * whose selected slice changed.
 */
export function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState: () => state,

    setState(partial) {
      const previous = state;
      state = { ...state, ...(typeof partial === 'function' ? partial(state) : partial) };
      listeners.forEach((listener) => listener(state, previous));
    },

    /**
     * @param {(state) => any} selector
     * @param {(selected, state) => void} listener
     * @returns {() => void} unsubscribe
     */
    subscribe(selector, listener) {
      const wrapped = (next, previous) => {
        const selected = selector(next);
        if (selected !== selector(previous)) listener(selected, next);
      };
      listeners.add(wrapped);
      return () => listeners.delete(wrapped);
    },
  };
}

export const store = createStore({
  currentUser: null,
  unreadCount: 0,
});
