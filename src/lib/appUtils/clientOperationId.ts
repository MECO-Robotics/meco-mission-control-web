export function createClientOperationId(cryptoApi: Pick<Crypto, "getRandomValues"> | undefined = globalThis.crypto) {
  const bytes = new Uint8Array(16);
  try {
    cryptoApi?.getRandomValues(bytes);
    if (bytes.some((value) => value !== 0)) return `operation-${Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("")}`;
  } catch { /* Insecure or restricted browser contexts may not expose cryptographic randomness. */ }
  return `operation-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
