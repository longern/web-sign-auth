import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  List,
  ListItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { secp256k1 } from "@noble/curves/secp256k1";
import { useNavigate, useParams } from "react-router";

import { Identity, useIdentities } from "./useIdentities";

function IdentityItem({
  label,
  value,
  endAdornment,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  endAdornment?: React.ReactNode;
}) {
  return (
    <React.Fragment>
      <ListItem sx={{ paddingY: 2 }}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          columnGap={3}
          sx={{ width: "100%", alignItems: { lg: "center" } }}
        >
          <Typography variant="subtitle2" sx={{ flexBasis: { lg: "156px" } }}>
            {label}
          </Typography>
          <Typography
            sx={{
              overflowWrap: "anywhere",
              wordBreak: "break-all",
            }}
          >
            {value}
          </Typography>
        </Stack>
        {endAdornment}
      </ListItem>
      <Divider component="li" />
    </React.Fragment>
  );
}

function IdentityDetail() {
  const { fingerprint } = useParams<{ fingerprint: string }>();
  const { t } = useTranslation();
  const { identities, setIdentities } = useIdentities();
  const [identity, setIdentity] = useState<Identity | undefined | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState<string>("");
  const navigate = useNavigate();

  const publicKey = useMemo(() => {
    if (!identity) return new Uint8Array();
    const publicKey = secp256k1.getPublicKey(identity.privateKey);
    return publicKey;
  }, [identity]);

  const handleDelete = () => {
    if (!identity) return;
    setIdentities(identities.filter((i) => i !== identity));
    setTimeout(() => {
      navigate("/");
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
    <Stack>
      <Typography variant="h5">{t("Your identity")}</Typography>
      <List>
        <IdentityItem
          label={t("Name")}
          value={
            editingName ? (
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
                    const newIdentity = {
                      ...identity,
                      name: name || undefined,
                    };
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
            )
          }
        />
        <IdentityItem label={t("Fingerprint")} value={identity.fingerprint} />
        <IdentityItem
          label={t("Public key")}
          value={btoa(String.fromCharCode(...publicKey))}
        />
        <IdentityItem
          label={t("Private key")}
          value={btoa(String.fromCharCode(...identity.privateKey))}
        />
      </List>
      <Box sx={{ marginTop: 4 }}>
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
