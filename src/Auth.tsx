import {
  Box,
  Button,
  Card,
  CircularProgress,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CreateIdentityDialog from "./CreateIdentityDialog";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { Identity } from "./app/identity";
import UsingAnotherDevice from "./UsingAnotherDevice";
import { sign } from "./app/authMiddleware";
import { setAuth } from "./app/auth";

function Auth() {
  const auth = useAppSelector((state) => state.auth);
  const { identities } = useAppSelector((state) => state.identity);
  const [currentIdentity, setCurrentIdentity] = useState<Identity | null>(null);
  const [selectingIdentity, setSelectingIdentity] = useState(false);
  const [createIdentityDialogOpen, setCreateIdentityDialogOpen] =
    useState(false);
  const [usingAnotherDevice, setUsingAnotherDevice] = useState(false);

  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  useEffect(() => {
    if (identities === null || currentIdentity !== null) return;
    setCurrentIdentity(identities[0]);
  }, [identities, currentIdentity]);

  return identities === null ||
    currentIdentity === null ||
    auth.origin === null ? (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      <CircularProgress />
    </Box>
  ) : auth.success !== null ? (
    auth.success ? (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          gap: 2,
        }}
      >
        <Box>You have signed as identity {currentIdentity.id}</Box>
      </Box>
    ) : (
      "Failed"
    )
  ) : (
    <Stack
      sx={{
        height: "100%",
        flexDirection: { xs: "column", lg: "row" },
        alignItems: "center",
        gap: 4,
        "& > *": {
          xs: { width: "100%" },
          lg: { flex: "0 1 50%", minWidth: 0 },
        },
      }}
    >
      <Stack sx={{ height: "100%", minHeight: 0 }}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", marginBottom: 4, gap: 2 }}
        >
          <img src="/logo192.png" alt="Logo" width="48" height="48" />
          <Typography variant="h5">Web Sign Auth</Typography>
        </Stack>
        <Typography variant="h6" gutterBottom>
          {t("aboutToSign")}
        </Typography>
        <Card
          variant="outlined"
          sx={{
            flexGrow: 1,
            padding: 2,
            overflowWrap: "break-word",
            overflowY: "auto",
          }}
        >
          <Box>{t("grantAccessIdentity")}</Box>
          <Box>{auth.origin}</Box>
          <Box>{auth.username}</Box>
        </Card>
      </Stack>
      <Stack
        spacing={3}
        sx={{
          minHeight: 160,
          flexShrink: 0,
          "& .MuiTypography-root": {
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
        }}
      >
        {usingAnotherDevice ? (
          <UsingAnotherDevice onBack={() => setUsingAnotherDevice(false)} />
        ) : identities.length === 0 ? (
          <React.Fragment>
            <Box sx={{ flexGrow: 1 }}>{t("identitiesNotFound")}</Box>
            <Stack direction="row" spacing={2}>
              <Button
                size="large"
                onClick={() => setCreateIdentityDialogOpen(true)}
              >
                {t("Create identity")}
              </Button>
              {!auth.hasPeerSocket && (
                <Button
                  size="large"
                  onClick={() => setUsingAnotherDevice(true)}
                >
                  {t("Use another device")}
                </Button>
              )}
            </Stack>
            <Box sx={{ display: "flex" }}>
              <Box sx={{ flexGrow: 1 }}></Box>
              <Button
                variant="outlined"
                size="large"
                onClick={() => window.close()}
              >
                {t("Cancel")}
              </Button>
            </Box>
          </React.Fragment>
        ) : !selectingIdentity ? (
          <React.Fragment>
            <Typography variant="h6">{t("Sign as")}</Typography>
            {currentIdentity.name ? (
              <ListItemText
                primary={currentIdentity.name}
                secondary={currentIdentity.id}
              />
            ) : (
              <ListItemText primary={currentIdentity.id} />
            )}
            <Stack direction="row" spacing={2}>
              <Button
                sx={{ marginLeft: 1 }}
                onClick={() => setSelectingIdentity(true)}
              >
                {t("Use another identity")}
              </Button>
              <Box sx={{ flexGrow: 1 }}></Box>
              <Button
                variant="outlined"
                size="large"
                onClick={() => window.close()}
              >
                {t("Cancel")}
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={async () => {
                  await sign({
                    identity: currentIdentity,
                    origin: auth.origin,
                    challenge: auth.challenge,
                  });
                  window.close();
                  setTimeout(() => dispatch(setAuth({ success: true })), 4);
                }}
                disabled={currentIdentity === null}
              >
                {t("Sign")}
              </Button>
            </Stack>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <FormControl>
              <InputLabel id="select-identity-label">
                {t("Identity")}
              </InputLabel>
              <Select
                labelId="select-identity-label"
                id="select-identity"
                label={t("Identity")}
                value={currentIdentity.id}
                onChange={(event) =>
                  setCurrentIdentity(
                    identities.find(
                      (identity) => identity.id === event.target.value
                    ) ?? null
                  )
                }
              >
                {identities.map((identity, index) => (
                  <MenuItem key={index} value={identity.id}>
                    {identity.name || identity.id.slice(0, 8)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              {!auth.hasPeerSocket && (
                <Button
                  size="large"
                  onClick={() => setUsingAnotherDevice(true)}
                >
                  {t("Use another device")}
                </Button>
              )}
              <Box sx={{ flexGrow: 1 }}></Box>
              <Button
                size="large"
                onClick={() => setCreateIdentityDialogOpen(true)}
              >
                {t("Create identity")}
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={() => setSelectingIdentity(false)}
              >
                {t("Ok")}
              </Button>
            </Stack>
          </React.Fragment>
        )}
      </Stack>
      <CreateIdentityDialog
        open={createIdentityDialogOpen}
        onClose={() => setCreateIdentityDialogOpen(false)}
      />
    </Stack>
  );
}

export default Auth;
