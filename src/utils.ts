export function base64ToArrayBuffer(base64: string) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}
