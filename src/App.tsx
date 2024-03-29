import {
  Button,
  Card,
  CardActions,
  CircularProgress,
  Container,
  CssBaseline,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Snackbar,
  Stack,
  ThemeProvider,
  Tooltip,
  Typography,
  createTheme,
} from "@mui/material";
import React, { useCallback } from "react";
import { createIdentity, useIdentities } from "./useIdentities";
import Auth from "./Auth";
import IdentityDialog from "./IdentityDialog";

const theme = createTheme({
  palette: {
    background: {
      default: "#f5f5f5",
    },
  },
  typography: {
    button: {
      textTransform: "none",
    },
  },
});

function authenticate() {
  return new Promise<string>((resolve, reject) => {
    const childWindow = window.open(window.location.href);
    if (!childWindow) return;
    const challenge = crypto.getRandomValues(new Uint8Array(32)).buffer;
    const interval = setInterval(() => {
      if (childWindow.closed) {
        clearInterval(interval);
        reject(new Error("Window closed"));
      }
      childWindow.postMessage(
        { type: "auth", challenge, origin: window.location.origin },
        "*"
      );
    }, 500);
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

    setTimeout(() => {
      if (childWindow.closed) return;
      childWindow.close();
      clearInterval(interval);
      reject(new Error("Timeout"));
    }, 60000);
  });
}

function IdentityList() {
  const { identities, fingerprints, setIdentities } = useIdentities();
  const [message, setMessage] = React.useState<string | null>(null);
  const [currentIdentity, setCurrentIdentity] =
    React.useState<CryptoKeyPair | null>(null);
  const [showIdentityDialog, setShowIdentityDialog] = React.useState(false);

  const handleTryIdentity = useCallback(() => {
    authenticate()
      .then((fingerprint) => {
        setMessage(`Authenticated as ${fingerprint.slice(0, 8)}`);
      })
      .catch((error) => {
        setMessage(error.message);
      });
  }, []);

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
      <Stack sx={{ alignItems: "center", marginY: 4, gap: 2 }}>
        <img src="/logo192.png" alt="Logo" width="96" height="96" />
        <Typography variant="h4">Web Sign Auth</Typography>
      </Stack>
      <Stack sx={{ width: "100%" }}>
        <Typography variant="h5">Identities</Typography>
        {identities.length > 0 && (
          <List>
            {identities.map((keypair, index) => (
              <React.Fragment key={index}>
                <ListItem disablePadding>
                  <Tooltip title={fingerprints.get(keypair)}>
                    <ListItemButton
                      onClick={() => {
                        setCurrentIdentity(keypair);
                        setShowIdentityDialog(true);
                      }}
                    >
                      <ListItemText
                        primary={fingerprints.get(keypair)?.slice(0, 8)}
                      />
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
        <CardActions sx={{ marginTop: 4 }}>
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
          <Snackbar
            open={message !== null}
            autoHideDuration={5000}
            onClose={() => setMessage(null)}
            message={message}
          />
        </CardActions>
      </Stack>
      <IdentityDialog
        identity={currentIdentity}
        open={showIdentityDialog}
        onClose={() => setShowIdentityDialog(false)}
      />
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
