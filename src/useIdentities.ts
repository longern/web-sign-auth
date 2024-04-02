import { useEffect, useState } from "react";
import { secp256k1 } from "@noble/curves/secp256k1";

import {
  arrayBufferToBase64,
  base58Fingerprint,
  base64ToArrayBuffer,
} from "./utils";

export interface Identity {
  name?: string;
  fingerprint: string;
  privateKey: Uint8Array;
}

export async function createIdentity(): Promise<Identity> {
  const privateKey = crypto.getRandomValues(new Uint8Array(32));
  const publicKey = secp256k1.getPublicKey(privateKey);
  const fingerprint = await base58Fingerprint(publicKey);
  return { privateKey, fingerprint };
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
