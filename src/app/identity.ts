import {
  Middleware,
  PayloadAction,
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import {
  arrayBufferToBase64,
  base58Fingerprint,
  base64ToArrayBuffer,
} from "./utils";
import { AppState } from "./store";

const { secp256k1 } = await import("@noble/curves/secp256k1");

export interface Identity {
  name?: string;
  id: string;
  privateKey: string;
}

const IDENTITIES_KEY = "webSignAuthIdentities";

const identitySlice = createSlice({
  name: "identity",
  initialState: {
    identities: null as Identity[] | null,
  },
  reducers: {
    setIdentities(state, action: PayloadAction<Identity[]>) {
      state.identities = action.payload;
    },
  },
});

async function createIdentity(options?: {
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
    const privateKeyBase64 = arrayBufferToBase64(privateKey);
    const publicKey = secp256k1.getPublicKey(privateKey);
    const fingerprint = await base58Fingerprint(publicKey);
    if (options.signal?.aborted) throw new Error("Aborted");
    if (!options.prefix || fingerprint.startsWith(options.prefix)) {
      return {
        name: options.name,
        id: fingerprint,
        privateKey: privateKeyBase64,
      };
    }
  }
}

export const appendIdentityThunk = createAsyncThunk(
  "identity/append",
  async (options: { name?: string; prefix?: string }, thunkAPI) => {
    const state = thunkAPI.getState() as AppState;
    const newIdentity = await createIdentity({
      signal: thunkAPI.signal,
      ...options,
    });
    thunkAPI.dispatch(
      identitySlice.actions.setIdentities([
        ...state.identity.identities,
        newIdentity,
      ])
    );
  }
);

async function parseIdentity(identity: {
  name?: string;
  privateKey: string;
}): Promise<Identity> {
  const { name, privateKey: privateKeyBase64 } = identity;
  const privateKey = base64ToArrayBuffer(privateKeyBase64);
  const publicKey = secp256k1.getPublicKey(privateKey);
  const fingerprint = await base58Fingerprint(publicKey);
  return { name, id: fingerprint, privateKey: privateKeyBase64 };
}

async function initializeIdentities(): Promise<Identity[]> {
  const identities = window.localStorage.getItem(IDENTITIES_KEY);
  if (!identities) return [];
  const parsed = Promise.all(JSON.parse(identities).map(parseIdentity));
  return parsed;
}

type ValueOf<T> = T[keyof T];
type IdentityActions = ReturnType<ValueOf<typeof identitySlice.actions>>;

export const identitiesMiddleware: Middleware<{}, any> = (store) => {
  initializeIdentities().then((parsed) =>
    store.dispatch(setIdentities(parsed))
  );
  return (next) => async (action: IdentityActions) => {
    next(action);
    if (!action.type.startsWith("identity/")) return;

    switch (action.type) {
      case identitySlice.actions.setIdentities.type: {
        const identities = action.payload;
        if (identities === null) return;
        if (identities.length === 0)
          window.localStorage.removeItem(IDENTITIES_KEY);
        else
          window.localStorage.setItem(
            IDENTITIES_KEY,
            JSON.stringify(identities)
          );
        break;
      }
    }
  };
};

export const { setIdentities } = identitySlice.actions;
export default identitySlice.reducer;
