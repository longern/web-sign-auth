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
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "./app/hooks";
import { appendIdentityThunk } from "./app/identity";

function isValidPrefix(prefix: string) {
  return prefix.match(/^[1-9A-HJ-NP-Za-km-z]{1,3}$/);
}

interface AbortablePromise {
  abort(): void;
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
  const [abortablePromise, setAbortablePromise] =
    useState<AbortablePromise | null>(null);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const handleClose = useCallback(() => {
    abortablePromise?.abort();
    setAbortablePromise(null);
    onClose();
  }, [abortablePromise, onClose]);

  const handleCreate = useCallback(() => {
    const thunk = dispatch(
      appendIdentityThunk({
        name: name || undefined,
        prefix: prefix || undefined,
      })
    );
    setAbortablePromise(thunk);

    thunk
      .unwrap()
      .then(() => {
        setAbortablePromise(null);
        onClose();
        setTimeout(() => {
          window.location.reload();
        }, 4);
      })
      .catch(() => {});
  }, [dispatch, name, prefix, onClose]);

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
              label={t("ID prefix")}
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
            abortablePromise !== null ||
            (prefix.length > 0 && !isValidPrefix(prefix))
          }
          startIcon={
            abortablePromise !== null ? (
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
