/** Delays `callback` until `waitMs` have passed without another call. */
export function debounce(callback, waitMs) {
  let timeoutId;
  const debounced = (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), waitMs);
  };
  debounced.cancel = () => clearTimeout(timeoutId);
  return debounced;
}
