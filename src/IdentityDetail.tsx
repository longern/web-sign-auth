import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { Identity, useIdentities } from "./useIdentities";
import { secp256k1 } from "@noble/curves/secp256k1";

function IdentityDetail({ fingerprint }: { fingerprint: string }) {
  const { t } = useTranslation();
  const { identities, setIdentities } = useIdentities();
  const [identity, setIdentity] = useState<Identity | undefined | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState<string>("");

  const publicKey = useMemo(() => {
    if (!identity) return new Uint8Array();
    const publicKey = secp256k1.getPublicKey(identity.privateKey);
    return publicKey;
  }, [identity]);

  const handleDelete = () => {
    if (identity === null) return;
    setIdentities(identities.filter((i) => i !== identity));
    setTimeout(() => {
      window.location.href = "/";
    }, 4);
  };

  useEffect(() => {
    if (identities === null) return;
    const identity =
      fingerprint.length <= 8
        ? undefined
        : identities.find((identity) =>
            identity.fingerprint.startsWith(fingerprint)
          );
    setIdentity(identity);
  }, [identities, fingerprint]);

  return identity === null ? (
    <CircularProgress />
  ) : identity === undefined ? (
    t("Identity not found")
  ) : (
    <Stack spacing={2}>
      <Grid container>
        <Grid item xs={12} lg={4}>
          <Typography variant="h6">{t("Name")}</Typography>
        </Grid>
        <Grid item xs={12} lg={8}>
          {editingName ? (
            <Stack direction="row" spacing={1}>
              <TextField
                variant="standard"
                hiddenLabel
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button
                onClick={() => {
                  setEditingName(false);
                  const newIdentity = { ...identity, name: name || undefined };
                  setIdentity(newIdentity);
                  setIdentities((identities) =>
                    identities.map((i) => (i === identity ? newIdentity : i))
                  );
                }}
              >
                {t("Save")}
              </Button>
            </Stack>
          ) : (
            <React.Fragment>
              {identity.name ? (
                identity.name
              ) : (
                <Typography component={"span"} color="textSecondary">
                  {t("Unnamed")}
                </Typography>
              )}
              <Button
                sx={{ marginLeft: 1 }}
                onClick={() => {
                  setEditingName(true);
                  setName(identity.name || "");
                }}
              >
                {t("Edit")}
              </Button>
            </React.Fragment>
          )}
        </Grid>
        <Grid item xs={12} lg={4}>
          <Typography variant="h6" marginTop={2}>
            {t("Fingerprint")}
          </Typography>
        </Grid>
        <Grid item xs={12} lg={8}>
          {identity.fingerprint}
        </Grid>
        <Grid item xs={12} lg={4}>
          <Typography variant="h6" marginTop={2}>
            {t("Public key")}
          </Typography>
        </Grid>
        <Grid item xs={12} lg={8} sx={{ overflowWrap: "anywhere" }}>
          {btoa(String.fromCharCode(...publicKey))}
        </Grid>
        <Grid item xs={12} lg={4}>
          <Typography variant="h6" marginTop={2}>
            {t("Private key")}
          </Typography>
        </Grid>
        <Grid item xs={12} lg={8} sx={{ overflowWrap: "anywhere" }}>
          {btoa(String.fromCharCode(...identity.privateKey))}
        </Grid>
      </Grid>
      <Box>
        <Button
          variant="outlined"
          size="large"
          color="error"
          onClick={() => setShowConfirmDelete(true)}
        >
          {t("Delete identity")}
        </Button>
      </Box>
      <Dialog
        open={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
      >
        <DialogContent>
          <Typography>
            {t("Are you sure you want to delete this identity?")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDelete(false)}>
            {t("Cancel")}
          </Button>
          <Button onClick={handleDelete} color="error">
            {t("Delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export default IdentityDetail;
