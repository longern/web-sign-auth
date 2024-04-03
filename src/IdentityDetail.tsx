import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  Close as CloseIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { secp256k1 } from "@noble/curves/secp256k1";

import { Identity, useIdentities } from "./useIdentities";

function QRCode({ text }: { text: string }) {
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    import("qrcode").then(async ({ toDataURL }) => {
      const url = await toDataURL(text, { width: 192 });
      imgRef.current.src = url;
    });
  }, [text]);
  return <img ref={imgRef} alt="QR code" width={192} height={192} />;
}

function PrivateKeyDialog({
  open,
  onClose,
  privateKey,
}: {
  open: boolean;
  onClose: () => void;
  privateKey: Uint8Array;
}) {
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [tab, setTab] = useState<"base64" | "qrcode" | "mnemonic">("base64");
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      onTransitionExited={() => {
        if (!open) {
          setShowPrivateKey(false);
          setTab("base64");
        }
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{ position: "absolute", right: 8, top: 8 }}
      >
        <CloseIcon />
      </IconButton>
      <DialogTitle>{t("Private key")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Alert severity="warning">{t("doNotShare")}</Alert>
          {!showPrivateKey ? (
            <Button
              variant="contained"
              size="large"
              onClick={() => setShowPrivateKey(true)}
            >
              {t("Show private key")}
            </Button>
          ) : (
            <React.Fragment>
              <Tabs value={tab} onChange={(_, value) => setTab(value)}>
                <Tab value="base64" label="Base64" />
                <Tab value="mnemonic" label={t("Mnemonic")} />
                <Tab value="qrcode" label={t("QR code")} />
              </Tabs>
              <Box sx={{ wordBreak: "break-all" }}>
                {tab === "base64" ? (
                  <Stack spacing={2}>
                    <Card variant="outlined" sx={{ padding: 2 }}>
                      {btoa(String.fromCharCode(...privateKey))}
                    </Card>
                    <Button
                      variant="contained"
                      size="large"
                      disabled={!navigator.clipboard}
                      onClick={() =>
                        navigator.clipboard.writeText(
                          btoa(String.fromCharCode(...privateKey))
                        )
                      }
                    >
                      {t("Copy to clipboard")}
                    </Button>
                  </Stack>
                ) : tab === "mnemonic" ? (
                  <Stack spacing={2}>
                    <Card variant="outlined" sx={{ padding: 2 }}>
                      {t("Coming soon")}
                    </Card>
                    <Button variant="contained" size="large">
                      {t("Copy to clipboard")}
                    </Button>
                  </Stack>
                ) : tab === "qrcode" ? (
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <QRCode text={btoa(String.fromCharCode(...privateKey))} />
                  </Box>
                ) : null}
              </Box>
            </React.Fragment>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

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
  const [showPrivateKey, setShowPrivateKey] = useState(false);
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
      <PrivateKeyDialog
        open={showPrivateKey}
        onClose={() => setShowPrivateKey(false)}
        privateKey={identity.privateKey}
      />
    </Stack>
  );
}

export default IdentityDetail;
