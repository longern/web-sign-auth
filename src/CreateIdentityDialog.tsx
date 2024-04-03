import React, { useCallback, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
} from "@mui/material";
import { createIdentity, useIdentities } from "./useIdentities";
import { useTranslation } from "react-i18next";

function isValidPrefix(prefix: string) {
  return prefix.match(/^[1-9A-HJ-NP-Za-km-z]{1,3}$/);
}

function CreateIdentityDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const { setIdentities } = useIdentities();
  const { t } = useTranslation();

  const handleClose = useCallback(() => {
    abortController?.abort();
    setAbortController(null);
    onClose();
  }, [abortController, onClose]);

  const handleCreate = useCallback(() => {
    const abortController = new AbortController();
    setAbortController(abortController);
    createIdentity({
      name: name || undefined,
      prefix: prefix || undefined,
      signal: abortController.signal,
    })
      .then((identity) => {
        setIdentities((identities) => [...identities, identity]);
        setAbortController(null);
        onClose();
        setTimeout(() => {
          window.location.reload();
        }, 4);
      })
      .catch(() => {});
  }, [name, prefix, setIdentities, onClose]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        {t("beforeCreating")}
        <ul style={{ paddingLeft: 20 }}>
          <li>{t("doNotShare")}</li>
          <li>{t("properlyStore")}</li>
        </ul>
        <Card variant="outlined">
          <CardContent>
            <TextField
              variant="standard"
              fullWidth
              label={t("Name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              variant="standard"
              fullWidth
              margin="normal"
              label={t("Fingerprint prefix")}
              value={prefix}
              error={prefix.length > 0 && !isValidPrefix(prefix)}
              onChange={(e) => setPrefix(e.target.value)}
            />
          </CardContent>
        </Card>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("Cancel")}</Button>
        <Button
          variant="contained"
          disabled={
            abortController !== null ||
            (prefix.length > 0 && !isValidPrefix(prefix))
          }
          startIcon={
            abortController ? (
              <CircularProgress color="inherit" size={16} />
            ) : null
          }
          onClick={handleCreate}
        >
          {t("Create identity")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateIdentityDialog;
