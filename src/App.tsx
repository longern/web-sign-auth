import {
  Button,
  Card,
  CardActions,
  CircularProgress,
  Container,
  CssBaseline,
  List,
  ListItem,
  ListItemButton,
  Stack,
  ThemeProvider,
  Tooltip,
  Typography,
  createTheme,
} from "@mui/material";
import React from "react";
import { createIdentity, useIdentities } from "./useIdentities";
import Auth from "./Auth";

const theme = createTheme({
  palette: {
    background: {
      default: "whitesmoke",
    },
  },
  typography: {
    button: {
      textTransform: "none",
    },
  },
});

function handleTryIdentity() {
  return new Promise<string>((resolve, reject) => {
    const childWindow = window.open(window.location.href);
    if (!childWindow) return;
    const challenge = crypto.getRandomValues(new Uint8Array(32)).buffer;
    const interval = setInterval(() => {
      childWindow.postMessage(
        { type: "auth", challenge, origin: window.location.origin },
        "*"
      );
    });
    childWindow.onmessage = async (event) => {
      if (event.data.type === "signature") {
        clearInterval(interval);
        const { fingerprint, signature, publicKey } = event.data;
        const valid = await crypto.subtle.verify(
          { name: "ECDSA", hash: "SHA-256" },
          publicKey,
          signature,
          challenge
        );
        if (valid) {
          resolve(fingerprint);
        } else {
          reject(new Error("Invalid signature"));
        }
      }
    };
  });
}

function IdentityList() {
  const { identities, fingerprints, setIdentities } = useIdentities();

  return identities === null ? (
    <CircularProgress />
  ) : (
    <Stack
      sx={{
        height: "100%",
        flexDirection: { lg: "row" },
        alignItems: "center",
        "& > *": {
          lg: { flex: "1 0" },
        },
      }}
    >
      <Stack sx={{ alignItems: "center", margin: 4, gap: 2 }}>
        <img src="/logo192.png" alt="Logo" width="96" height="96" />
        <Typography variant="h4">Web Sign Auth</Typography>
      </Stack>
      <Stack sx={{ width: "100%" }}>
        {identities.length > 0 && (
          <List>
            {identities.map((keypair, index) => (
              <ListItem key={index} disablePadding>
                <Tooltip title={fingerprints.get(keypair)}>
                  <ListItemButton>
                    {fingerprints.get(keypair)?.slice(0, 8)}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>
        )}
        <CardActions>
          <Button
            size="large"
            onClick={() =>
              createIdentity().then((identity) =>
                setIdentities((identities) => [...identities, identity])
              )
            }
          >
            Create Identity
          </Button>
          <Button
            variant="contained"
            size="large"
            disabled={identities.length === 0}
            onClick={handleTryIdentity}
          >
            Try Identity
          </Button>
        </CardActions>
      </Stack>
    </Stack>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container
        maxWidth="lg"
        sx={{
          padding: { xs: 0, lg: 4 },
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Card
          sx={{
            borderRadius: { xs: 0, lg: 4 },
            height: { xs: "100vh", lg: "384px" },
            padding: { xs: 3, lg: 4 },
          }}
          elevation={0}
        >
          {window?.opener || window?.parent !== window?.self ? (
            <Auth />
          ) : (
            <IdentityList />
          )}
        </Card>
      </Container>
    </ThemeProvider>
  );
}

export default App;
