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
import { Identity, useIdentities } from "./useIdentities";

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

  const handleSign = useCallback(async () => {
    if (currentIdentity === null || challengeRef.current === null) return;
    const signature = await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      currentIdentity.privateKey,
      challengeRef.current
    );
    window.parent.postMessage(
      {
        type: "signature",
        fingerprint: currentIdentity.fingerprint,
        signature,
        publicKey: currentIdentity.publicKey,
      },
      origin,
      [signature]
    );
    setSuccess(true);
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
          secondary={"wants to access your identity " + (username ?? "")}
        />
      </Box>
      <Stack spacing={4} sx={{ width: "100%" }}>
        <FormControl>
          <InputLabel id="select-identity-label">Identity</InputLabel>
          <Select
            labelId="select-identity-label"
            id="select-identity"
            label="Identity"
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
                {identity.fingerprint.slice(0, 8)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            "& > *": { flex: 1 },
          }}
        >
          <Button
            variant="outlined"
            size="large"
            onClick={() => window.close()}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={handleSign}
            disabled={currentIdentity === null}
          >
            Sign
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}

export default Auth;
