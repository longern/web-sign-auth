import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardActions,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { NavigateNext as NavigateNextIcon } from "@mui/icons-material";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { secp256k1 } from "@noble/curves/secp256k1";

import { useIdentities } from "./useIdentities";
import CreateIdentityDialog from "./CreateIdentityDialog";
import ImportIdentityDialog from "./ImportIdentityDialog";

function toBase64Uint8Array(base64: string) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function authenticate(providerOrigin: string, options?: { timeout?: number }) {
  return new Promise<{ name: string; id: string }>((resolve, reject) => {
    const timeout = options?.timeout;
    const childWindow = window.open(providerOrigin);
    if (!childWindow) return;
    const challenge = btoa(
      String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))
    );
    const interval = setInterval(() => {
      if (childWindow.closed) {
        clearInterval(interval);
        window.removeEventListener("message", messageHandler);
        reject(new Error("Window closed"));
      }
      childWindow.postMessage(
        { publicKey: { challenge, origin: window.location.origin } },
        "*"
      );
    }, 500);

    const messageHandler = async (event: MessageEvent) => {
      if (event.origin !== providerOrigin) return;
      if (event.data.type === "public-key") {
        clearInterval(interval);
        window.removeEventListener("message", messageHandler);
        const {
          name,
          id,
          response: { clientDataJSON, signature, publicKey },
        }: {
          name: string;
          id: string;
          response: {
            clientDataJSON: string;
            signature: string;
            publicKey: string;
          };
        } = event.data;
        const clientData = JSON.parse(clientDataJSON);
        if (clientData.challenge !== challenge) {
          return reject(new Error("Invalid challenge"));
        }
        const digest = new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(clientDataJSON)
          )
        );
        const valid = secp256k1.verify(
          secp256k1.Signature.fromCompact(toBase64Uint8Array(signature)),
          digest,
          toBase64Uint8Array(publicKey)
        );
        if (valid) {
          resolve({ name, id });
        } else {
          reject(new Error("Invalid signature"));
        }
      }
    };

    window.addEventListener("message", messageHandler);

    if (!timeout) return;
    setTimeout(() => {
      if (childWindow.closed) return;
      childWindow.close();
      clearInterval(interval);
      window.removeEventListener("message", messageHandler);
      reject(new Error("Timeout"));
    }, timeout * 1000);
  });
}

function IdentitiesList() {
  const { identities } = useIdentities();
  const [message, setMessage] = React.useState<string | null>(null);
  const [createIdentityDialogOpen, setCreateIdentityDialogOpen] =
    React.useState(false);
  const [importIdentityDialogOpen, setImportIdentityDialogOpen] =
    React.useState(false);

  const { t } = useTranslation();

  const handleTryIdentity = useCallback(() => {
    authenticate(window.location.origin, { timeout: 120 })
      .then(({ name, id }) => {
        setMessage(`${t("Authenticated as")} ${name || id.slice(0, 8)}`);
      })
      .catch((error) => {
        setMessage(t("Authentication failed"));
      });
  }, [t]);

  return identities === null ? (
    <CircularProgress />
  ) : (
    <Stack spacing={4} sx={{ height: "100%" }}>
      <Stack direction="row" sx={{ alignItems: "center", paddingY: 1, gap: 2 }}>
        <img src="/logo192.png" alt="Logo" width="48" height="48" />
        <Typography variant="h5">Web Sign Auth</Typography>
      </Stack>
      {identities.length > 0 ? (
        <React.Fragment>
          <Alert
            severity="success"
            action={
              <Button
                size="large"
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
          <Card variant="outlined" sx={{ padding: 2, overflowY: "auto" }}>
            <Typography variant="h5" gutterBottom>
              {t("Identities you created")}
            </Typography>
            <List sx={{ flexGrow: 1, overflowY: "auto" }} disablePadding>
              {identities.length > 0 &&
                identities.map((identity, index) => (
                  <React.Fragment key={index}>
                    <ListItem disablePadding>
                      <ListItemButton
                        component={RouterLink}
                        to={`/${identity.id}`}
                        sx={{ minHeight: 60 }}
                      >
                        <ListItemText
                          primary={identity.name || identity.id.slice(0, 8)}
                        />
                        <ListItemIcon sx={{ minWidth: 0 }}>
                          <NavigateNextIcon />
                        </ListItemIcon>
                      </ListItemButton>
                    </ListItem>
                    {index !== identities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
            </List>
          </Card>
        </React.Fragment>
      ) : (
        <Alert
          severity="info"
          action={
            <Button
              size="large"
              onClick={handleTryIdentity}
              sx={{ textWrap: "nowrap" }}
            >
              {t("Try it")}
            </Button>
          }
        >
          {t("identitiesNotFound")}
        </Alert>
      )}
      <CardActions sx={{ marginTop: 1 }}>
        <Button
          variant="outlined"
          size="large"
          onClick={() => setCreateIdentityDialogOpen(true)}
        >
          {t("Create identity")}
        </Button>
        <Button size="large" onClick={() => setImportIdentityDialogOpen(true)}>
          {t("Import existing identity")}
        </Button>
      </CardActions>
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
      <ImportIdentityDialog
        open={importIdentityDialogOpen}
        onClose={() => setImportIdentityDialogOpen(false)}
      />
    </Stack>
  );
}

export default IdentitiesList;
