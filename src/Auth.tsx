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
} from "@mui/material";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useIdentities } from "./useIdentities";

type ParentMessage = {
  type: "auth";
  origin: string;
  challenge: ArrayBuffer;
  username?: string;
};

function Auth() {
  const [origin, setOrigin] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const challengeRef = useRef<ArrayBuffer | null>(null);
  const { identities, fingerprints } = useIdentities();
  const [currentIdentity, setCurrentIdentity] = useState<CryptoKeyPair | null>(
    null
  );

  const reverseFingerprints = useMemo(() => {
    return new Map(
      Array.from(fingerprints).map(([key, value]) => [value, key])
    );
  }, [fingerprints]);

  const handleSign = useCallback(async () => {
    if (currentIdentity === null || challengeRef.current === null) return;
    const signature = await crypto.subtle.sign(
      "ECDSA",
      currentIdentity.privateKey,
      challengeRef.current
    );
    window.parent.postMessage(
      {
        type: "signature",
        fingerprint: fingerprints.get(currentIdentity),
        signature,
      },
      origin,
      [signature]
    );
    setTimeout(() => window.close(), 3000);
  }, [currentIdentity, fingerprints, origin]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent<ParentMessage>) => {
      if (event.data.type === "auth") {
        if (!event.data.origin || !event.data.challenge) return;
        setOrigin(event.data.origin);
        setUsername(event.data.username);
        challengeRef.current = event.data.challenge;
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (identities === null || currentIdentity !== null) return;
    setCurrentIdentity(identities[0]);
  }, [identities, currentIdentity]);

  return identities === null || origin === null ? (
    <CircularProgress />
  ) : (
    <Stack
      spacing={2}
      sx={{
        height: "100%",
        flexDirection: { xs: "column", lg: "row" },
        alignItems: "center",
        "& > *": {
          sx: { flex: 0 },
          lg: { flex: "1 0" },
        },
      }}
    >
      <Box>
        <Box sx={{ display: "flex", justifyContent: "center", padding: 4 }}>
          <img src="/logo192.png" alt="logo" width="64" height="64" />
        </Box>
        <ListItemText
          primary={origin}
          secondary={"wants to access your identity " + username}
        />
      </Box>
      <Stack spacing={2} sx={{ width: "100%" }}>
        <FormControl>
          <InputLabel id="select-identity-label">Identity</InputLabel>
          <Select
            labelId="select-identity-label"
            id="select-identity"
            label="Identity"
            value={fingerprints.get(currentIdentity) ?? ""}
            onChange={(event) =>
              setCurrentIdentity(reverseFingerprints.get(event.target.value))
            }
          >
            {identities.map((keypair, index) => (
              <MenuItem key={index} value={fingerprints.get(keypair)}>
                {fingerprints.get(keypair)?.slice(0, 8)}
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
