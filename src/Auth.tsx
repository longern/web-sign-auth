import {
  Box,
  Button,
  Card,
  CircularProgress,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Identity, useIdentities } from "./useIdentities";
import CreateIdentityDialog from "./CreateIdentityDialog";
import base58 from "bs58";
import type { PeerSocket } from "./peer";

const { secp256k1 } = await import("@noble/curves/secp256k1");

type ParentMessage = {
  publicKey: {
    origin: string;
    challenge: string;
    username?: string;
  };
};

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

function UsingAnotherDevice({
  onConnect,
  onBack,
}: {
  onConnect?: (socket: PeerSocket) => void;
  onBack?: () => void;
}) {
  const [channel, setChannel] = useState<string | null>(null);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const onConnectRef = useRef(onConnect);

  const { t } = useTranslation();

  useEffect(() => {
    onConnectRef.current = onConnect;
  }, [onConnect]);

  useEffect(() => {
    const channel = base58.encode(crypto.getRandomValues(new Uint8Array(16)));
    const abortController = new AbortController();
    import("qrcode").then(async ({ toDataURL }) => {
      const url = new URL(window.location.href);
      url.searchParams.set("channel", channel);
      const dataUrl = await toDataURL(url.toString(), { width: 192 });
      setChannel(channel);
      imgRef.current!.src = dataUrl;
    });
    import("./peer").then(({ PeerServer }) => {
      const peerServer = new PeerServer(RTC_CONFIGURATION);
      peerServer.bind(channel);
      peerServer.addEventListener(
        "connection",
        (event: CustomEvent<PeerSocket>) => {
          const socket = event.detail;
          peerServer.close();
          socket.addEventListener("open", () => {
            setRemoteConnected(true);
            onConnectRef.current?.(socket);
            abortController.signal.addEventListener("abort", () =>
              socket.close()
            );
          });
        }
      );
      abortController.signal.addEventListener("abort", () =>
        peerServer.close()
      );
    });

    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <React.Fragment>
      {remoteConnected ? (
        <Typography sx={{ flexGrow: 1 }}>
          {t("operateOnAnotherDevice")}
        </Typography>
      ) : (
        <Typography>{t("scanQRCodeToSign")}</Typography>
      )}
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <img
          ref={imgRef}
          alt="QR code"
          width="192"
          height="192"
          style={{
            display: channel === null || remoteConnected ? "none" : "block",
          }}
        />
      </Box>
      <Stack direction="row" sx={{ width: "100%" }}>
        <Button size="large" onClick={onBack}>
          {t("Back")}
        </Button>
        <Box sx={{ flexGrow: 1 }}></Box>
        <Button size="large" onClick={() => window.close()}>
          {t("Cancel")}
        </Button>
      </Stack>
    </React.Fragment>
  );
}

function Auth() {
  const [success, setSuccess] = useState<boolean | null>(null);
  const [origin, setOrigin] = useState<string | null>(null);
  const [username, setUsername] = useState<string | undefined>(undefined);
  const challengeRef = useRef<string | null>(null);
  const { identities } = useIdentities();
  const [currentIdentity, setCurrentIdentity] = useState<Identity | null>(null);
  const [selectingIdentity, setSelectingIdentity] = useState(false);
  const [createIdentityDialogOpen, setCreateIdentityDialogOpen] =
    useState(false);
  const [usingAnotherDevice, setUsingAnotherDevice] = useState(false);
  const [peerSocket, setPeerSocket] = useState<PeerSocket | null>(null);

  const { t } = useTranslation();

  const handleSign = useCallback(async () => {
    if (currentIdentity === null || challengeRef.current === null) return;
    const publicKey = secp256k1.getPublicKey(currentIdentity.privateKey);
    const clientData = {
      challenge: challengeRef.current,
      origin,
      timestamp: Date.now(),
    };
    const clientDataJSON = JSON.stringify(clientData);
    const digest = new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(clientDataJSON)
      )
    );
    const signature = secp256k1
      .sign(digest, currentIdentity.privateKey)
      .toCompactRawBytes();

    const message = {
      type: "public-key",
      name: currentIdentity.name,
      id: currentIdentity.id,
      response: {
        clientDataJSON,
        signature: btoa(String.fromCharCode(...signature)),
        publicKey: btoa(String.fromCharCode(...publicKey)),
      },
    };
    if (peerSocket) {
      peerSocket.send(JSON.stringify(message));
    } else {
      window.opener.postMessage(message, origin);
    }
    setTimeout(() => setSuccess(true), 4);
    window.close();
  }, [currentIdentity, origin, peerSocket]);

  const handleMessage = useCallback((data: ParentMessage) => {
    if (data.publicKey) {
      const { publicKey } = data;
      if (!publicKey.origin || !publicKey.challenge) return;
      setOrigin(publicKey.origin);
      setUsername(publicKey.username);
      challengeRef.current = publicKey.challenge;
    }
  }, []);

  useEffect(() => {
    if (origin !== null || !window.opener) return;
    const handleOpenerMessage = async (event: MessageEvent<ParentMessage>) => {
      if (event.source !== window.opener) return;
      handleMessage(event.data);
      window.removeEventListener("message", handleOpenerMessage);
    };
    window.addEventListener("message", handleOpenerMessage);
    return () => window.removeEventListener("message", handleOpenerMessage);
  }, [handleMessage, origin]);

  useEffect(() => {
    const channel = new URLSearchParams(window.location.search).get("channel");
    if (!channel) return;
    const abortController = new AbortController();
    import("./peer").then(({ PeerSocket }) => {
      const peerSocket = new PeerSocket(channel!, RTC_CONFIGURATION);
      peerSocket.addEventListener("message", (event: MessageEvent<string>) => {
        handleMessage(JSON.parse(event.data));
      });
      abortController.signal.addEventListener("abort", () =>
        peerSocket.close()
      );
      setPeerSocket(peerSocket);
    });
    return () => abortController.abort();
  }, [handleMessage]);

  useEffect(() => {
    if (identities === null || currentIdentity !== null) return;
    setCurrentIdentity(identities[0]);
  }, [identities, currentIdentity]);

  return identities === null || origin === null ? (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      <CircularProgress />
    </Box>
  ) : success !== null ? (
    success ? (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          gap: 2,
        }}
      >
        <Box>You have signed as identity {currentIdentity.id}</Box>
      </Box>
    ) : (
      "Failed"
    )
  ) : (
    <Stack
      sx={{
        height: "100%",
        flexDirection: { xs: "column", lg: "row" },
        alignItems: "center",
        gap: 4,
        "& > *": {
          xs: { width: "100%" },
          lg: { flex: "0 1 50%", minWidth: 0 },
        },
      }}
    >
      <Stack sx={{ height: "100%", minHeight: 0 }}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", marginBottom: 4, gap: 2 }}
        >
          <img src="/logo192.png" alt="Logo" width="48" height="48" />
          <Typography variant="h5">Web Sign Auth</Typography>
        </Stack>
        <Typography variant="h6" gutterBottom>
          {t("aboutToSign")}
        </Typography>
        <Card
          variant="outlined"
          sx={{
            flexGrow: 1,
            padding: 2,
            overflowWrap: "break-word",
            overflowY: "auto",
          }}
        >
          <Box>{t("grantAccessIdentity")}</Box>
          <Box>{origin}</Box>
          <Box>{username}</Box>
        </Card>
      </Stack>
      <Stack
        spacing={3}
        sx={{
          minHeight: 160,
          flexShrink: 0,
          "& .MuiTypography-root": {
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
        }}
      >
        {usingAnotherDevice ? (
          <UsingAnotherDevice
            onConnect={(socket) => {
              socket.addEventListener(
                "message",
                (event: MessageEvent<string>) => {
                  const data = JSON.parse(event.data);
                  window.opener.postMessage(data, origin);
                  setTimeout(() => setSuccess(true), 4);
                  window.close();
                }
              );
              socket.send(
                JSON.stringify({
                  publicKey: { origin, challenge: challengeRef.current },
                })
              );
            }}
            onBack={() => setUsingAnotherDevice(false)}
          />
        ) : identities.length === 0 ? (
          <React.Fragment>
            <Box sx={{ flexGrow: 1 }}>{t("identitiesNotFound")}</Box>
            <Box>
              <Button
                sx={{ marginLeft: 1 }}
                onClick={() => setCreateIdentityDialogOpen(true)}
              >
                {t("Create identity")}
              </Button>
            </Box>
            <Stack direction="row" spacing={2}>
              {peerSocket === null && (
                <Button
                  size="large"
                  onClick={() => setUsingAnotherDevice(true)}
                >
                  {t("Use another device")}
                </Button>
              )}
              <Box sx={{ flexGrow: 1 }}></Box>
              <Button
                variant="outlined"
                size="large"
                onClick={() => window.close()}
              >
                {t("Cancel")}
              </Button>
            </Stack>
          </React.Fragment>
        ) : !selectingIdentity ? (
          <React.Fragment>
            <Typography variant="h6">{t("Sign as")}</Typography>
            {currentIdentity.name ? (
              <ListItemText
                primary={currentIdentity.name}
                secondary={currentIdentity.id}
              />
            ) : (
              <ListItemText primary={currentIdentity.id} />
            )}
            <Stack direction="row" spacing={2}>
              <Button
                sx={{ marginLeft: 1 }}
                onClick={() => setSelectingIdentity(true)}
              >
                {t("Use another identity")}
              </Button>
              <Box sx={{ flexGrow: 1 }}></Box>
              <Button
                variant="outlined"
                size="large"
                onClick={() => window.close()}
              >
                {t("Cancel")}
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handleSign}
                disabled={currentIdentity === null}
              >
                {t("Sign")}
              </Button>
            </Stack>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <FormControl>
              <InputLabel id="select-identity-label">
                {t("Identity")}
              </InputLabel>
              <Select
                labelId="select-identity-label"
                id="select-identity"
                label={t("Identity")}
                value={currentIdentity.id}
                onChange={(event) =>
                  setCurrentIdentity(
                    identities.find(
                      (identity) => identity.id === event.target.value
                    ) ?? null
                  )
                }
              >
                {identities.map((identity, index) => (
                  <MenuItem key={index} value={identity.id}>
                    {identity.name || identity.id.slice(0, 8)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              {peerSocket === null && (
                <Button
                  size="large"
                  onClick={() => setUsingAnotherDevice(true)}
                >
                  {t("Use another device")}
                </Button>
              )}
              <Box sx={{ flexGrow: 1 }}></Box>
              <Button
                size="large"
                onClick={() => setCreateIdentityDialogOpen(true)}
              >
                {t("Create identity")}
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={() => setSelectingIdentity(false)}
              >
                {t("Ok")}
              </Button>
            </Stack>
          </React.Fragment>
        )}
      </Stack>
      <CreateIdentityDialog
        open={createIdentityDialogOpen}
        onClose={() => setCreateIdentityDialogOpen(false)}
      />
    </Stack>
  );
}

export default Auth;
