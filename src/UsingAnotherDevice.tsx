import { Box, Button, Stack, Typography } from "@mui/material";
import base58 from "bs58";
import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import QRCode from "./QRCode";
import { setAuth } from "./app/auth";
import { closePeerServer, createPeerServer } from "./app/authMiddleware";
import { useAppDispatch, useAppSelector } from "./app/hooks";

function UsingAnotherDevice({ onBack }: { onBack?: () => void }) {
  const channel = useAppSelector((state) => state.auth.channel);
  const remoteConnected = useAppSelector((state) => state.auth.remoteConnected);

  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const channelURL = useMemo(() => {
    const url = new URL(window.location.href);
    for (const key of url.searchParams.keys()) url.searchParams.delete(key);
    url.searchParams.set("channel", channel);
    return url.toString();
  }, [channel]);

  useEffect(() => {
    const channel = base58.encode(crypto.getRandomValues(new Uint8Array(16)));
    dispatch(setAuth({ channel }));
    createPeerServer(channel);

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
        {channel !== null && !remoteConnected && <QRCode text={channelURL} />}
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
