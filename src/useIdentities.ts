import { useEffect, useState } from "react";
import base58 from "bs58";

import { arrayBufferToBase64, base64ToArrayBuffer } from "./utils";

export interface Identity extends CryptoKeyPair {
  name?: string;
  fingerprint: string;
}

export async function createIdentity(): Promise<Identity> {
  const { publicKey, privateKey } = await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );
  const publicKeyData = await crypto.subtle.exportKey("spki", publicKey);
  const hash = await crypto.subtle.digest("SHA-256", publicKeyData);
  const fingerprint = base58.encode(new Uint8Array(hash));
  return { publicKey, privateKey, fingerprint };
}

async function stringifyIdentity(identity: Identity) {
  const [privateKeyData, publicKeyData] = await Promise.all([
    crypto.subtle.exportKey("pkcs8", identity.privateKey),
    crypto.subtle.exportKey("spki", identity.publicKey),
  ]);
  const privateKey = arrayBufferToBase64(privateKeyData);
  const publicKey = arrayBufferToBase64(publicKeyData);
  return { ...identity, privateKey, publicKey };
}

async function parseIdentity(identity: {
  name?: string;
  fingerprint: string;
  privateKey: string;
  publicKey: string;
}): Promise<Identity> {
  const {
    name,
    fingerprint,
    privateKey: privateKeyBase64,
    publicKey: publicKeyBase64,
  } = identity;
  const publicKeyData = base64ToArrayBuffer(publicKeyBase64);
  const hash = await crypto.subtle.digest("SHA-256", publicKeyData);
  const fingerprintCheck = base58.encode(new Uint8Array(hash));
  if (fingerprint !== fingerprintCheck) {
    throw new Error("Fingerprint mismatch");
  }
  const privateKeyData = base64ToArrayBuffer(privateKeyBase64);
  const [privateKey, publicKey] = await Promise.all([
    crypto.subtle.importKey(
      "pkcs8",
      privateKeyData,
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign"]
    ),
    crypto.subtle.importKey(
      "spki",
      publicKeyData,
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["verify"]
    ),
  ]);
  return { name, fingerprint, privateKey, publicKey };
}

const IDENTITIES_KEY = "webSignAuthIdentities";

export function useIdentities() {
  const [identities, setIdentities] = useState<Identity[]>(null);

  useEffect(() => {
    const identities = window.localStorage.getItem(IDENTITIES_KEY);
    if (identities) {
      Promise.all(JSON.parse(identities).map(parseIdentity)).then(
        setIdentities
      );
    } else {
      setIdentities([]);
    }
  }, []);

  useEffect(() => {
    if (identities === null) return;
    if (identities.length === 0) window.localStorage.removeItem(IDENTITIES_KEY);
    else
      Promise.all(identities.map(stringifyIdentity)).then((identities) => {
        window.localStorage.setItem(IDENTITIES_KEY, JSON.stringify(identities));
      });
  }, [identities]);

  return { identities, setIdentities };
}
