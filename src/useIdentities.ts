import { useEffect, useState } from "react";

import {
  arrayBufferToBase64,
  base58Fingerprint,
  base64ToArrayBuffer,
} from "./utils";

const { secp256k1 } = await import("@noble/curves/secp256k1");

export interface Identity {
  name?: string;
  fingerprint: string;
  privateKey: Uint8Array;
}

export async function createIdentity(options?: {
  name?: string;
  prefix?: string;
  signal?: AbortSignal;
}): Promise<Identity> {
  options = options || {};
  if (options.prefix && !options.prefix.match(/^[1-9A-HJ-NP-Za-km-z]{1,3}$/)) {
    throw new Error("Invalid prefix");
  }
  while (true) {
    const privateKey = crypto.getRandomValues(new Uint8Array(32));
    const publicKey = secp256k1.getPublicKey(privateKey);
    const fingerprint = await base58Fingerprint(publicKey);
    if (options.signal?.aborted) throw new Error("Operation aborted");
    if (!options.prefix || fingerprint.startsWith(options.prefix)) {
      return { name: options.name, fingerprint, privateKey };
    }
  }
}

function jsonBinaryReplacer(_: string, value: any) {
  if (value instanceof Uint8Array) {
    return arrayBufferToBase64(value);
  }
  return value;
}

async function parseIdentity(identity: {
  name?: string;
  privateKey: string;
}): Promise<Identity> {
  const { name, privateKey: privateKeyBase64 } = identity;
  const privateKey = base64ToArrayBuffer(privateKeyBase64);
  const publicKey = secp256k1.getPublicKey(privateKey);
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
      window.localStorage.setItem(
        IDENTITIES_KEY,
        JSON.stringify(identities, jsonBinaryReplacer)
      );
  }, [identities]);

  return { identities, setIdentities };
}
