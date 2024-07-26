import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";

function SettingsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [turnServer, setTurnServer] = React.useState<
    | null
    | { type: "none" }
    | {
        type: "turn";
        url: string;
        username: string;
        password: string;
      }
    | {
        type: "cloudflare";
        keyId: string;
        keyToken: string;
        customDomain?: string;
      }
  >(null);

  useEffect(() => {
    if (!open) return;
    const storedTurnServer = localStorage.getItem("webSignAuthTurnServer");
    if (storedTurnServer) {
      setTurnServer(JSON.parse(storedTurnServer));
    } else {
      setTurnServer({ type: "none" });
    }
  }, [open]);

  useEffect(() => {
    if (!turnServer) return;
    if (turnServer.type !== "none") {
      localStorage.setItem("webSignAuthTurnServer", JSON.stringify(turnServer));
    } else {
      localStorage.removeItem("webSignAuthTurnServer");
    }
  }, [turnServer]);

  if (!turnServer) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ paddingTop: 1 }}>
          <FormControl fullWidth>
            <InputLabel>TURN Server</InputLabel>
            <Select
              label="TURN Server"
              value={turnServer.type ?? "none"}
              onChange={(event) => {
                switch (event.target.value) {
                  case "none":
                    setTurnServer({ type: "none" });
                    break;
                  case "turn":
                    setTurnServer({
                      type: "turn",
                      url: "",
                      username: "",
                      password: "",
                    });
                    break;
                  case "cloudflare":
                    setTurnServer({
                      type: "cloudflare",
                      keyId: "",
                      keyToken: "",
                    });
                    break;
                }
              }}
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="turn">TURN Server</MenuItem>
              <MenuItem value="cloudflare">Cloudflare</MenuItem>
            </Select>
          </FormControl>
          {turnServer.type === "turn" ? (
            <React.Fragment>
              <TextField
                label="URL"
                value={turnServer.url}
                required
                onChange={(event) =>
                  setTurnServer({ ...turnServer, url: event.target.value })
                }
              />
              <TextField
                label="Username"
                value={turnServer.username}
                required
                onChange={(event) =>
                  setTurnServer({ ...turnServer, username: event.target.value })
                }
              />
              <TextField
                label="Password"
                value={turnServer.password}
                required
                onChange={(event) =>
                  setTurnServer({ ...turnServer, password: event.target.value })
                }
              />
            </React.Fragment>
          ) : turnServer.type === "cloudflare" ? (
            <React.Fragment>
              <TextField
                label="Key ID"
                value={turnServer.keyId}
                required
                onChange={(event) =>
                  setTurnServer({ ...turnServer, keyId: event.target.value })
                }
              />
              <TextField
                label="Key Token"
                value={turnServer.keyToken}
                required
                onChange={(event) =>
                  setTurnServer({ ...turnServer, keyToken: event.target.value })
                }
              />
              <TextField
                label="Custom Domain"
                value={turnServer.customDomain}
                onChange={(event) =>
                  setTurnServer({
                    ...turnServer,
                    customDomain: event.target.value,
                  })
                }
              />
            </React.Fragment>
          ) : null}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default SettingsDialog;
