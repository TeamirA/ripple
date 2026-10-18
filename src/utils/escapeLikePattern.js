/** Escapes LIKE/ILIKE wildcards so user input is matched literally. */
export function escapeLikePattern(value) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}
