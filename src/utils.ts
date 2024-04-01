import base58 from "bs58";

export function base64ToArrayBuffer(base64: string) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}

export async function base58Fingerprint(publicKey: CryptoKey): Promise<string> {
  const publicKeyData = await crypto.subtle.exportKey("spki", publicKey);
  const hash = await crypto.subtle.digest("SHA-256", publicKeyData);
  const fingerprint = base58.encode(new Uint8Array(hash));
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
