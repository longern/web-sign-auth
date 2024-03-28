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

function IdentityList() {
  const { identities, fingerprints, setIdentities } = useIdentities();

  return identities === null ? (
    <CircularProgress />
  ) : (
    <Stack>
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
      <CardActions>
        <Button
          onClick={() =>
            createIdentity().then((identity) =>
              setIdentities((identities) => [...identities, identity])
            )
          }
        >
          Create Identity
        </Button>
      </CardActions>
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
