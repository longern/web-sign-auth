import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { Close as CloseIcon } from "@mui/icons-material";

function Mnemonic({ privateKey }: { privateKey: Uint8Array }) {
  const [mnemonic, setMnemonic] = useState<string>("");
  const { t } = useTranslation();

  useEffect(() => {
    fetch(
      "https://cdn.jsdelivr.net/npm/bip39@3.1.0/src/wordlists/english.json"
    ).then(async (res) => {
      const wordlist = await res.json();
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
  }, [privateKey]);

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
                  <Mnemonic privateKey={privateKey} />
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

export default PrivateKeyDialog;
