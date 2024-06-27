import {
  NavigateBefore as NavigateBeforeIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  List,
  ListItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { secp256k1 } from "@noble/curves/secp256k1";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import PrivateKeyDialog from "./PrivateKeyDialog";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { Identity, setIdentities } from "./app/identity";
import { base64ToArrayBuffer } from "./app/utils";

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
          <Box
            sx={{
              width: "100%",
              overflowWrap: "anywhere",
              wordBreak: "break-all",
            }}
          >
            {value}
          </Box>
        </Stack>
        {endAdornment}
      </ListItem>
      <Divider component="li" />
    </React.Fragment>
  );
}

function Editable({
  value,
  onChange,
  fallback,
}: {
  value?: string;
  onChange: (value: string) => void;
  fallback?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);

  const { t } = useTranslation();

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      {editing ? (
        <React.Fragment>
          <TextField
            variant="standard"
            hiddenLabel
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button
            onClick={() => {
              setEditing(false);
              onChange(text);
            }}
          >
            {t("Save")}
          </Button>
          <Button onClick={() => setEditing(false)}>{t("Cancel")}</Button>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Box
            sx={{
              width: 180,
              overflowX: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {value || fallback}
          </Box>
          <Button
            onClick={() => {
              setEditing(true);
              setText(value || "");
            }}
          >
            {t("Edit")}
          </Button>
        </React.Fragment>
      )}
    </Stack>
  );
}

function IdentityDetail() {
  const { id } = useParams<{ id: string }>();
  const identities = useAppSelector((state) => state.identity.identities);
  const [identity, setIdentity] = useState<Identity | undefined | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const publicKey = useMemo(() => {
    if (!identity) return new Uint8Array();
    const privateKey = base64ToArrayBuffer(identity.privateKey);
    const publicKey = secp256k1.getPublicKey(privateKey);
    return publicKey;
  }, [identity]);

  const handleDelete = () => {
    if (!identity) return;
    dispatch(setIdentities(identities.filter((i) => i !== identity)));
    setTimeout(() => {
      navigate("/");
    }, 4);
  };

  useEffect(() => {
    if (identities === null) return;
    const identity =
      id.length <= 8
        ? undefined
        : identities.find((identity) => identity.id.startsWith(id));
    setIdentity(identity);
  }, [identities, id]);

  return identity === null ? (
    <CircularProgress />
  ) : identity === undefined ? (
    t("Identity not found")
  ) : (
    <React.Fragment>
      <Stack direction="row" spacing={1} alignItems="center">
        <IconButton onClick={() => navigate("/")}>
          <NavigateBeforeIcon />
        </IconButton>
        <Typography variant="h5">{t("Your identity")}</Typography>
      </Stack>
      <List>
        <IdentityItem
          label={t("Name")}
          value={
            <Editable
              value={identity.name}
              onChange={(name) => {
                const newIdentity = { ...identity, name: name || undefined };
                setIdentity(newIdentity);
                dispatch(
                  setIdentities(
                    identities.map((i) => (i === identity ? newIdentity : i))
                  )
                );
              }}
              fallback={
                <Typography component={"span"} color="textSecondary">
                  {t("(Unnamed)")}
                </Typography>
              }
            />
          }
        />
        <IdentityItem label={t("ID")} value={identity.id} />
        <IdentityItem
          label={t("Public key")}
          value={btoa(String.fromCharCode(...publicKey))}
          endAdornment={
            navigator.share && (
              <IconButton
                sx={{ marginY: -1, marginLeft: 1 }}
                onClick={() =>
                  navigator.share({
                    text: btoa(String.fromCharCode(...publicKey)),
                  })
                }
              >
                <ShareIcon />
              </IconButton>
            )
          }
        />
        <IdentityItem
          label={t("Private key")}
          value="********"
          endAdornment={
            <IconButton
              sx={{ marginY: -1, marginLeft: 1 }}
              onClick={() => setShowPrivateKey(true)}
            >
              <VisibilityIcon />
            </IconButton>
          }
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
          <Typography>{t("confirmDelete")}</Typography>
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
      <PrivateKeyDialog
        open={showPrivateKey}
        onClose={() => setShowPrivateKey(false)}
        privateKey={identity.privateKey}
      />
    </React.Fragment>
  );
}

export default IdentityDetail;
