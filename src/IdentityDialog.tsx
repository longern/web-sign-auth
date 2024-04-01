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
import { privateKeyToPublicKey } from "./utils";

function IdentityDialog({
  identity,
  open,
  onClose,
  onChange,
  onDelete,
}: {
  identity: Identity | null;
  open: boolean;
  onClose: () => void;
  onChange: (identity: Identity) => void;
  onDelete: () => void;
}) {
  const [publicKey, setPublicKey] = useState<string>("");
  const [privateKey, setPrivateKey] = useState<string>("");
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (!open || !identity?.privateKey) return;
    setName(identity.name ?? "");
    (async () => {
      const privateKeyData = await crypto.subtle.exportKey(
        "pkcs8",
        identity.privateKey
      );
      const privateKeyBase64 = btoa(
        String.fromCharCode(...new Uint8Array(privateKeyData))
      );
      setPrivateKey(privateKeyBase64);

      const publicKey = await privateKeyToPublicKey(identity.privateKey);
      const publicKeyData = await crypto.subtle.exportKey("spki", publicKey);
      const publicKeyBase64 = btoa(
        String.fromCharCode(...new Uint8Array(publicKeyData))
      );
      setPublicKey(publicKeyBase64);
    })();
  }, [open, identity]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {"Identity " + (identity?.name || identity?.fingerprint.slice(0, 8))}
      </DialogTitle>
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
        <Button
          variant="contained"
          onClick={() => onChange({ ...identity, name })}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default IdentityDialog;
