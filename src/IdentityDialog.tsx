import React, {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Identity } from "./useIdentities";

function IdentityDialog({
  identity,
  identityMetadata,
  open,
  onClose,
  onDelete,
}: {
  identity: Identity | null;
  identityMetadata?: { name: string; id: string };
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [publicKey, setPublicKey] = useState<string>("");
  const [privateKey, setPrivateKey] = useState<string>("");
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (!open || !identity?.privateKey) return;
    (async () => {
      const privateKeyData = await crypto.subtle.exportKey(
        "pkcs8",
        identity.privateKey
      );
      const privateKey = btoa(
        String.fromCharCode(...new Uint8Array(privateKeyData))
      );
      setPrivateKey(privateKey);
    })();
  }, [open, identity?.privateKey]);

  useEffect(() => {
    if (!open || !identity?.publicKey) return;
    (async () => {
      const publicKeyData = await crypto.subtle.exportKey(
        "spki",
        identity.publicKey
      );
      const publicKey = btoa(
        String.fromCharCode(...new Uint8Array(publicKeyData))
      );
      setPublicKey(publicKey);
    })();
  }, [open, identity?.publicKey]);

  useEffect(() => {
    if (!open) return;
    setName(identityMetadata?.name ?? "");
  }, [open, identityMetadata?.name]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{identityMetadata?.name ?? "Identity"}</DialogTitle>
      <DialogContent sx={{ "& > *:not(:last-child)": { marginBottom: 4 } }}>
        <TextField
          variant="standard"
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          fullWidth
        />
        <TextField
          label="Fingerprint"
          helperText="Base58-encoded SHA-256 hash of the public key"
          value={identity?.fingerprint ?? ""}
          fullWidth
          InputProps={{
            readOnly: true,
          }}
        />
        <TextField
          label="Public Key"
          value={publicKey}
          fullWidth
          multiline
          InputProps={{
            readOnly: true,
          }}
        />
        <TextField
          label="Private Key"
          value={privateKey}
          fullWidth
          multiline
          InputProps={{
            readOnly: true,
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button color="error" onClick={onDelete}>
          Delete
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default IdentityDialog;
