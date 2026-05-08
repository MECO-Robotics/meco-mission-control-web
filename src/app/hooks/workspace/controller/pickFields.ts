export function pickFields<T extends object, const K extends readonly (keyof T)[]>(
  source: T,
  keys: K,
): Pick<T, K[number]> {
  const result = {} as Pick<T, K[number]>;

  for (const key of keys) {
    result[key] = source[key];
  }

  return result;
}
