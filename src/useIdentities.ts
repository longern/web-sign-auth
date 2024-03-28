import { useEffect, useState } from "react";
import base58 from "bs58";

import { arrayBufferToBase64, base64ToArrayBuffer } from "./utils";

export function createIdentity() {
  return crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );
}

async function stringifyKeyPair(keyPair: CryptoKeyPair) {
  const [privateKeyData, publicKeyData] = await Promise.all([
    crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
    crypto.subtle.exportKey("spki", keyPair.publicKey),
  ]);
  const privateKey = arrayBufferToBase64(privateKeyData);
  const publicKey = arrayBufferToBase64(publicKeyData);
  return { privateKey, publicKey };
}

async function parseKeyPair(keyPair: {
  privateKey: string;
  publicKey: string;
}) {
  const [privateKey, publicKey] = await Promise.all([
    crypto.subtle.importKey(
      "pkcs8",
      base64ToArrayBuffer(keyPair.privateKey),
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign"]
    ),
    crypto.subtle.importKey(
      "spki",
      base64ToArrayBuffer(keyPair.publicKey),
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["verify"]
    ),
  ]);
  return { privateKey, publicKey } as CryptoKeyPair;
}

const IDENTITIES_KEY = "webSignAuthIdentities";

export function useIdentities() {
  const [identities, setIdentities] = useState<CryptoKeyPair[]>(null);
  const [fingerprints, setFingerprints] = useState<Map<CryptoKeyPair, string>>(
    new Map()
  );

  useEffect(() => {
    const identities = window.localStorage.getItem(IDENTITIES_KEY);
    if (identities) {
      Promise.all(JSON.parse(identities).map(parseKeyPair)).then(setIdentities);
    } else {
      setIdentities([]);
    }
  }, []);

  useEffect(() => {
    if (identities === null) return;
    if (identities.length === 0) window.localStorage.removeItem(IDENTITIES_KEY);
    else
      Promise.all(identities.map(stringifyKeyPair)).then((identities) => {
        window.localStorage.setItem(IDENTITIES_KEY, JSON.stringify(identities));
      });
  }, [identities]);

  useEffect(() => {
    if (identities === null) return;
    Promise.all(
      identities.map(async (identity) => {
        const privateKeyData = await crypto.subtle.exportKey(
          "pkcs8",
          identity.privateKey
        );
        const privateKey = await crypto.subtle.digest(
          "SHA-256",
          privateKeyData
        );
        return base58.encode(new Uint8Array(privateKey));
      })
    ).then((fingerprints) => {
      setFingerprints(
        new Map(
          fingerprints.map((fingerprint, index) => [
            identities[index],
            fingerprint,
          ])
        )
      );
    });
  }, [identities]);

  return { identities, fingerprints, setIdentities };
}
