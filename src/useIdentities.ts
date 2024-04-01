import { useEffect, useState } from "react";

import {
  arrayBufferToBase64,
  base58Fingerprint,
  base64ToArrayBuffer,
  privateKeyToPublicKey,
} from "./utils";

export interface Identity {
  name?: string;
  fingerprint: string;
  privateKey: CryptoKey;
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
  const fingerprint = await base58Fingerprint(publicKey);
  return { privateKey, fingerprint };
}

async function stringifyIdentity(identity: Identity) {
  const privateKeyData = await crypto.subtle.exportKey(
    "pkcs8",
    identity.privateKey
  );
  const privateKey = arrayBufferToBase64(privateKeyData);
  return { name: identity.name, privateKey };
}

async function parseIdentity(identity: {
  name?: string;
  privateKey: string;
}): Promise<Identity> {
  const { name, privateKey: privateKeyBase64 } = identity;
  const privateKeyData = base64ToArrayBuffer(privateKeyBase64);
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyData,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"]
  );
  const publicKey = await privateKeyToPublicKey(privateKey);
  const fingerprint = await base58Fingerprint(publicKey);
  return { name, fingerprint, privateKey };
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
