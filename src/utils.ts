import base58 from "bs58";

export function base64ToArrayBuffer(base64: string) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

export function arrayBufferToBase64(buffer: Uint8Array) {
  return btoa(String.fromCharCode.apply(null, buffer));
}

export async function base58Fingerprint(
  publicKey: Uint8Array
): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", publicKey.buffer);
  const fingerprint = base58.encode(new Uint8Array(hash.slice(0, 20)));
  return fingerprint;
}

export async function privateKeyToPublicKey(privateKey: CryptoKey) {
  const jwkPrivate = await crypto.subtle.exportKey("jwk", privateKey);
  delete jwkPrivate.d;
  jwkPrivate.key_ops = ["verify"];
  return crypto.subtle.importKey(
    "jwk",
    jwkPrivate,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"]
  );
}
