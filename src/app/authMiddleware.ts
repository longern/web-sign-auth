import type { Middleware } from "@reduxjs/toolkit";

import { PeerServer, PeerSocket, Socket } from "./peer";
import { setAuth } from "./auth";
import type { Identity } from "./identity";
import { setMessage } from "./snackbar";
import type { AppDispatch, AppState } from "./store";
import { base64ToArrayBuffer } from "./utils";

type ParentMessage = {
  publicKey: {
    origin: string;
    challenge: string;
    username?: string;
  };
};

let authSocket: Socket;
let peerServer: PeerServer;

const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    { urls: "STUN:freestun.net:3479" },
    { urls: "STUN:stun.cloudflare.com:3478" },
    {
      urls: "TURN:freeturn.net:3478",
      username: "free",
      credential: "free",
    },
  ],
};

function handleMessage(data: ParentMessage, dispatch: AppDispatch) {
  if (!data.publicKey) return;
  const { publicKey } = data;
  if (!publicKey.origin || !publicKey.challenge) return;
  const { origin, challenge, username } = publicKey;
  dispatch(setAuth({ origin, challenge, username }));
}

function handleChannel(channel: string, dispatch: AppDispatch) {
  const peerSocket = new PeerSocket(channel, {
    rtcConfiguration: RTC_CONFIGURATION,
  });
  peerSocket.addEventListener("message", (event: MessageEvent<string>) => {
    handleMessage(JSON.parse(event.data), dispatch);
  });
  peerSocket.addEventListener("error", (event: ErrorEvent) => {
    dispatch(setMessage(event.error.message));
  });
  authSocket = peerSocket;
  dispatch(setAuth({ hasPeerSocket: true }));
}

function handleCallbackURL(callbackURL: string, dispatch: AppDispatch) {
  const origin = new URL(callbackURL).origin;
  dispatch(setAuth({ origin }));
  authSocket = Object.assign(new EventTarget(), {
    send: (data: string) => {
      const searchParams = new URLSearchParams();
      searchParams.set("sign", data);
      window.location.href = `${callbackURL}?${searchParams.toString()}`;
    },
    close: () => {},
  });
}

function handleOpener(origin: string, dispatch: AppDispatch) {
  authSocket = Object.assign(new EventTarget(), {
    send: (data: string) => {
      window.opener.postMessage(JSON.parse(data), origin);
      window.close();
    },
    close: () => {},
  });
  const handleOpenerMessage = async (event: MessageEvent<ParentMessage>) => {
    if (event.source !== window.opener) return;
    handleMessage(event.data, dispatch);
    window.removeEventListener("message", handleOpenerMessage);
  };
  window.addEventListener("message", handleOpenerMessage);
}

const authMiddleware: Middleware<{}, AppState> = (store) => {
  const { auth } = store.getState();

  if (auth.channel) handleChannel(auth.channel, store.dispatch);
  else if (auth.callbackURL)
    handleCallbackURL(auth.callbackURL, store.dispatch);
  else if (window.opener) handleOpener(auth.origin, store.dispatch);

  return (next) => (action) => next(action);
};

export async function sign({
  identity,
  challenge,
  origin,
}: {
  identity: Identity;
  challenge: string;
  origin: string;
}) {
  const { secp256k1 } = await import("@noble/curves/secp256k1");
  const privateKey = base64ToArrayBuffer(identity.privateKey);
  const publicKey = secp256k1.getPublicKey(privateKey);
  const clientDataJSON = JSON.stringify({
    challenge,
    origin,
    timestamp: Date.now(),
  });
  const encoded = new TextEncoder().encode(clientDataJSON);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", encoded));
  const signature = secp256k1.sign(digest, privateKey).toCompactRawBytes();

  const message = {
    type: "public-key",
    name: identity.name,
    id: identity.id,
    response: {
      clientDataJSON,
      signature: btoa(String.fromCharCode(...signature)),
      publicKey: btoa(String.fromCharCode(...publicKey)),
    },
  };
  authSocket.send(JSON.stringify(message));
}

export async function createPeerServer(channel: string) {
  const { default: store } = await import("./store");
  const { PeerServer } = await import("./peer");
  peerServer = new PeerServer({ rtcConfiguration: RTC_CONFIGURATION });
  peerServer.bind(channel);
  const { auth } = store.getState();
  peerServer.addEventListener(
    "connection",
    (event: CustomEvent<PeerSocket>) => {
      const socket = event.detail;
      peerServer.close();
      socket.addEventListener("open", () => {
        store.dispatch(setAuth({ remoteConnected: true }));
        socket.send(
          JSON.stringify({
            publicKey: { origin: auth.origin, challenge: auth.challenge },
          })
        );
      });

      socket.addEventListener("message", (event: MessageEvent<string>) => {
        authSocket.send(event.data);
      });
    }
  );
}

export async function closePeerServer() {
  if (peerServer) peerServer.close();
}

export default authMiddleware;
