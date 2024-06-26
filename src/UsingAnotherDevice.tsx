import { Box, Button, Stack, Typography } from "@mui/material";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import base58 from "bs58";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { setAuth } from "./app/auth";
import { closePeerServer, createPeerServer } from "./app/authMiddleware";

function UsingAnotherDevice({ onBack }: { onBack?: () => void }) {
  const channel = useAppSelector((state) => state.auth.channel);
  const remoteConnected = useAppSelector((state) => state.auth.remoteConnected);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  useEffect(() => {
    const channel = base58.encode(crypto.getRandomValues(new Uint8Array(16)));
    dispatch(setAuth({ channel }));
    createPeerServer(channel);
    import("qrcode").then(async ({ toDataURL }) => {
      const url = new URL(window.location.href);
      Array.from(url.searchParams.keys()).forEach((key) =>
        url.searchParams.delete(key)
      );
      url.searchParams.set("channel", channel);
      const dataUrl = await toDataURL(url.toString(), { width: 192 });
      imgRef.current!.src = dataUrl;
    });

    return () => {
      closePeerServer();
    };
  }, [dispatch]);

  return (
    <React.Fragment>
      {remoteConnected ? (
        <Typography sx={{ flexGrow: 1 }}>
          {t("operateOnAnotherDevice")}
        </Typography>
      ) : (
        <Typography>{t("scanQRCodeToSign")}</Typography>
      )}
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <img
          ref={imgRef}
          alt="QR code"
          width="192"
          height="192"
          style={{
            display: channel === null || remoteConnected ? "none" : "block",
          }}
        />
      </Box>
      <Stack direction="row" sx={{ width: "100%" }}>
        <Button size="large" onClick={onBack}>
          {t("Back")}
        </Button>
        <Box sx={{ flexGrow: 1 }}></Box>
        <Button size="large" onClick={() => window.close()}>
          {t("Cancel")}
        </Button>
      </Stack>
    </React.Fragment>
  );
}

export default UsingAnotherDevice;
