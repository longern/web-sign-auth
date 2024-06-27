import { Close as CloseIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tab,
  Tabs,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { base64ToArrayBuffer } from "./app/utils";
import QRCode from "./QRCode";

function Mnemonic({ privateKey: privateKeyBase64 }: { privateKey: string }) {
  const [mnemonic, setMnemonic] = useState<string>("");
  const { t } = useTranslation();

  useEffect(() => {
    fetch(
      "https://cdn.jsdelivr.net/npm/bip39@3.1.0/src/wordlists/english.json"
    ).then(async (res) => {
      const wordlist = await res.json();
      const privateKey = base64ToArrayBuffer(privateKeyBase64);
      const hash = await crypto.subtle.digest("SHA-256", privateKey);
      const checksum = new Uint8Array(hash.slice(0, 2));
      const bits = new Uint8Array(privateKey.length + checksum.length);
      bits.set(privateKey);
      bits.set(checksum, privateKey.length);
      const checksumBitsLength = Math.floor((privateKey.length * 8) / 32);
      const bitsString = Array.from(bits)
        .map((byte) => byte.toString(2).padStart(8, "0"))
        .join("")
        .slice(0, privateKey.length * 8 + checksumBitsLength);
      const mnemonic: string[] = [];
      for (let i = 0; i < bitsString.length; i += 11) {
        const index = parseInt(bitsString.slice(i, i + 11), 2);
        mnemonic.push(wordlist[index]);
      }
      setMnemonic(mnemonic.join(" "));
    });
  }, [privateKeyBase64]);

  return (
    <Stack spacing={2}>
      <Card variant="outlined" sx={{ padding: 2 }}>
        {mnemonic || (
          <Box
            sx={{
              height: "3lh",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress />
          </Box>
        )}
      </Card>
      <Button
        variant="contained"
        size="large"
        disabled={!navigator.clipboard}
        onClick={() => navigator.clipboard.writeText(mnemonic)}
      >
        {t("Copy to clipboard")}
      </Button>
    </Stack>
  );
}

function PrivateKeyDialog({
  open,
  onClose,
  privateKey,
}: {
  open: boolean;
  onClose: () => void;
  privateKey: string;
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
                      {privateKey}
                    </Card>
                    <Button
                      variant="contained"
                      size="large"
                      disabled={!navigator.clipboard}
                      onClick={() => navigator.clipboard.writeText(privateKey)}
                    >
                      {t("Copy to clipboard")}
                    </Button>
                  </Stack>
                ) : tab === "mnemonic" ? (
                  <Mnemonic privateKey={privateKey} />
                ) : tab === "qrcode" ? (
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Card
                      variant="outlined"
                      sx={{
                        width: 192,
                        height: 192,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <QRCode
                        text={privateKey}
                        fallback={<CircularProgress />}
                      />
                    </Card>
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

export default PrivateKeyDialog;
