import React from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
} from "@mui/material";
import { createIdentity, useIdentities } from "./useIdentities";
import { useTranslation } from "react-i18next";

function CreateIdentityDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { setIdentities } = useIdentities();
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <Alert severity="warning"></Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("Cancel")}</Button>
        <Button
          variant="contained"
          onClick={() =>
            createIdentity().then((identity) => {
              setIdentities((identities) => [...identities, identity]);
              onClose();
              setTimeout(() => {
                window.location.reload();
              }, 4);
            })
          }
        >
          {t("Ok")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateIdentityDialog;
