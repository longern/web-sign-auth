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
import { base58Fingerprint, base64ToArrayBuffer } from "./app/utils";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { setIdentities } from "./app/identity";

function ImportIdentityDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [privateKeyBase64, setPrivateKeyBase64] = useState<string>("");
  const identities = useAppSelector((state) => state.identity.identities);
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

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
    const privateKey = base64ToArrayBuffer(privateKeyBase64);
    const publicKey = secp256k1.getPublicKey(privateKey);
    const id = await base58Fingerprint(publicKey);
    dispatch(
      setIdentities(
        identities.find((identity) => identity.id === id)
          ? identities
          : [...identities, { id, privateKey: privateKeyBase64 }]
      )
    );
    onClose();
  }, [dispatch, identities, onClose, privateKeyBase64]);

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
