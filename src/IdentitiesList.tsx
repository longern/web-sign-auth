import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CardActions,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { secp256k1 } from "@noble/curves/secp256k1";

import { useIdentities } from "./useIdentities";
import CreateIdentityDialog from "./CreateIdentityDialog";

function authenticate() {
  return new Promise<{ name: string; fingerprint: string }>(
    (resolve, reject) => {
      const childWindow = window.open(window.location.href);
      if (!childWindow) return;
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const interval = setInterval(() => {
        if (childWindow.closed) {
          clearInterval(interval);
          reject(new Error("Window closed"));
        }
        childWindow.postMessage(
          { type: "auth", challenge, origin: window.location.origin },
          "*"
        );
      }, 500);
      childWindow.onmessage = async (event) => {
        if (event.data.type === "signature") {
          clearInterval(interval);
          const {
            name,
            fingerprint,
            signature,
            publicKey,
          }: {
            name: string;
            fingerprint: string;
            signature: Uint8Array;
            publicKey: Uint8Array;
          } = event.data;
          const valid = secp256k1.verify(
            secp256k1.Signature.fromCompact(signature),
            new Uint8Array(challenge),
            publicKey
          );
          if (valid) {
            resolve({ name, fingerprint });
          } else {
            reject(new Error("Invalid signature"));
          }
        }
      };

      setTimeout(() => {
        if (childWindow.closed) return;
        childWindow.close();
        clearInterval(interval);
        reject(new Error("Timeout"));
      }, 60000);
    }
  );
}

function IdentitiesList() {
  const { identities } = useIdentities();
  const [message, setMessage] = React.useState<string | null>(null);
  const [createIdentityDialogOpen, setCreateIdentityDialogOpen] =
    React.useState(false);

  const { t } = useTranslation();

  const handleTryIdentity = useCallback(() => {
    authenticate()
      .then(({ name, fingerprint }) => {
        setMessage(
          `${t("Authenticated as")} ${name || fingerprint.slice(0, 8)}`
        );
      })
      .catch((error) => {
        setMessage(error.message);
      });
  }, [t]);

  return identities === null ? (
    <CircularProgress />
  ) : (
    <Stack
      sx={{
        height: "100%",
        flexDirection: { lg: "row" },
        alignItems: "center",
        "& > *": {
          lg: { flex: "1 0" },
        },
      }}
    >
      <Stack sx={{ alignItems: "center", marginY: 4, gap: 2 }}>
        <img src="/logo192.png" alt="Logo" width="96" height="96" />
        <Typography variant="h4">Web Sign Auth</Typography>
      </Stack>
      <Stack sx={{ width: "100%", height: "100%", minHeight: 0 }}>
        {identities.length > 0 ? (
          <Alert
            severity="success"
            action={
              <Button
                size="large"
                disabled={identities.length === 0}
                onClick={handleTryIdentity}
                sx={{ textWrap: "nowrap" }}
              >
                {t("Try it")}
              </Button>
            }
          >
            <AlertTitle>{t("Identity created!")}</AlertTitle>
            <Box>{t("canSign")}</Box>
          </Alert>
        ) : (
          <Alert severity="info">{t("noIdentities")}</Alert>
        )}
        <Typography variant="h5" sx={{ marginTop: 2, marginBottom: 1 }}>
          {t("Identities")}
        </Typography>
        <List sx={{ flexGrow: 1, overflowY: "auto" }} disablePadding>
          {identities.length > 0 &&
            identities.map((identity, index) => (
              <React.Fragment key={index}>
                <ListItem disablePadding>
                  <ListItemButton
                    component={RouterLink}
                    to={`/${identity.fingerprint}`}
                    sx={{ minHeight: 60 }}
                  >
                    <ListItemText
                      primary={
                        identity.name || identity.fingerprint.slice(0, 8)
                      }
                    />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
        </List>
        <CardActions
          sx={{
            marginTop: 1,
            justifyContent: "space-between",
          }}
        >
          <Button
            variant="outlined"
            size="large"
            onClick={() => setCreateIdentityDialogOpen(true)}
          >
            {t("Create identity")}
          </Button>
        </CardActions>
      </Stack>
      <Snackbar
        open={message !== null}
        autoHideDuration={5000}
        onClose={() => setMessage(null)}
        message={message}
      />
      <CreateIdentityDialog
        open={createIdentityDialogOpen}
        onClose={() => setCreateIdentityDialogOpen(false)}
      />
    </Stack>
  );
}

export default IdentitiesList;
