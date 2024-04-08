import {
  Box,
  Button,
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

const { secp256k1 } = await import("@noble/curves/secp256k1");

type ParentMessage = {
  type: "auth";
  origin: string;
  challenge: ArrayBuffer;
  username?: string;
};

function Auth() {
  const [success, setSuccess] = useState<boolean | null>(null);
  const [origin, setOrigin] = useState<string | null>(null);
  const [username, setUsername] = useState<string | undefined>(undefined);
  const challengeRef = useRef<ArrayBuffer | null>(null);
  const { identities } = useIdentities();
  const [currentIdentity, setCurrentIdentity] = useState<Identity | null>(null);
  const [selectingIdentity, setSelectingIdentity] = useState(false);
  const [createIdentityDialogOpen, setCreateIdentityDialogOpen] =
    useState(false);

  const { t } = useTranslation();

  const handleSign = useCallback(async () => {
    if (currentIdentity === null || challengeRef.current === null) return;
    const publicKey = secp256k1.getPublicKey(currentIdentity.privateKey);
    const clientData = {
      challenge: btoa(
        String.fromCharCode(...new Uint8Array(challengeRef.current))
      ),
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

    window.opener.postMessage(
      {
        type: "signature",
        name: currentIdentity.name,
        clientDataJSON,
        fingerprint: currentIdentity.fingerprint,
        signature,
        publicKey,
      },
      origin
    );
    setTimeout(() => setSuccess(true), 4);
    window.close();
  }, [currentIdentity, origin]);

  useEffect(() => {
    if (origin !== null) return;
    const handleMessage = async (event: MessageEvent<ParentMessage>) => {
      if (event.source !== window.opener) return;
      if (event.data.type === "auth") {
        if (!event.data.origin || !event.data.challenge) return;
        setOrigin(event.data.origin);
        setUsername(event.data.username);
        challengeRef.current = event.data.challenge;
      }
      window.removeEventListener("message", handleMessage);
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [origin]);

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
        <Box>You have signed as identity {currentIdentity.fingerprint}</Box>
      </Box>
    ) : (
      "Failed"
    )
  ) : (
    <Stack
      spacing={2}
      sx={{
        height: "100%",
        flexDirection: { xs: "column", lg: "row" },
        alignItems: "center",
        gap: 2,
        "& > *": {
          sx: { flex: 0 },
          lg: { flex: "1 0" },
        },
      }}
    >
      <Box sx={{ width: "100%" }}>
        <Stack sx={{ alignItems: "center", marginY: 4, gap: 2 }}>
          <img src="/logo192.png" alt="Logo" width="96" height="96" />
          <Typography variant="h4">Web Sign Auth</Typography>
        </Stack>
        <ListItemText
          primary={origin}
          secondary={t("wantsAccess") + " " + (username ?? "")}
        />
      </Box>
      <Stack
        spacing={4}
        sx={{
          width: "100%",
          "& .MuiTypography-root": {
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
        }}
      >
        {identities.length === 0 ? (
          <Box>
            {t("noIdentities")}
            <Button
              sx={{ marginLeft: 1 }}
              onClick={() => setCreateIdentityDialogOpen(true)}
            >
              {t("Create identity")}
            </Button>
          </Box>
        ) : !selectingIdentity ? (
          <React.Fragment>
            <Typography variant="h5">{t("Sign as")}</Typography>
            {currentIdentity.name ? (
              <ListItemText
                primary={currentIdentity.name}
                secondary={currentIdentity.fingerprint}
              />
            ) : (
              <ListItemText primary={currentIdentity.fingerprint} />
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
                value={currentIdentity.fingerprint}
                onChange={(event) =>
                  setCurrentIdentity(
                    identities.find(
                      (identity) => identity.fingerprint === event.target.value
                    ) ?? null
                  )
                }
              >
                {identities.map((identity, index) => (
                  <MenuItem key={index} value={identity.fingerprint}>
                    {identity.name || identity.fingerprint.slice(0, 8)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={4}>
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
