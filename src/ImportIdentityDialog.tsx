import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useIdentities } from "./useIdentities";
import { base58Fingerprint } from "./utils";

function ImportIdentityDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [privateKeyBase64, setPrivateKeyBase64] = useState<string>("");
  const { t } = useTranslation();
  const { setIdentities } = useIdentities();

  useEffect(() => {
    if (!open) {
      setPrivateKeyBase64("");
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard
        .readText()
        .then((text) => {
          if (text.match(/^[A-Za-z0-9+/]{40,50}={0,2}$/))
            setPrivateKeyBase64(text);
        })
        .catch(() => {});
    }
  }, [open]);

  const handleImport = useCallback(async () => {
    const { secp256k1 } = await import("@noble/curves/secp256k1");
    const privateKey = Uint8Array.from(atob(privateKeyBase64), (c) =>
      c.charCodeAt(0)
    );
    const publicKey = secp256k1.getPublicKey(privateKey);
    const fingerprint = await base58Fingerprint(publicKey);
    setIdentities((identities) =>
      identities.find((identity) => identity.fingerprint === fingerprint)
        ? identities
        : [...identities, { fingerprint, privateKey }]
    );
    onClose();
  }, [onClose, privateKeyBase64, setIdentities]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>{t("Import existing identity")}</DialogTitle>
      <DialogContent>
        <Typography>{t("pastePrivateKey")}</Typography>
        <TextField
          value={privateKeyBase64 || ""}
          onChange={(event) => setPrivateKeyBase64(event.target.value)}
          fullWidth
          label={t("Private key")}
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button size="large" onClick={onClose}>
          {t("Cancel")}
        </Button>
        <Button
          variant="contained"
          size="large"
          disabled={!privateKeyBase64}
          onClick={handleImport}
        >
          {t("Import")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ImportIdentityDialog;
