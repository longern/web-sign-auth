import {
  Card,
  Container,
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import React from "react";

import Auth from "./Auth";
import IdentitiesList from "./IdentitiesList";

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

const globalStyles = (
  <GlobalStyles
    styles={{
      "html, body, #root": {
        height: "100%",
      },
    }}
  />
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {globalStyles}
      <Container
        maxWidth="lg"
        sx={{
          padding: { xs: 0, lg: 4 },
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Card
          sx={{
            borderRadius: { xs: 0, lg: 4 },
            height: { xs: "100%", lg: "auto" },
            minHeight: { lg: 384 },
            padding: { xs: 3, lg: 4 },
          }}
          elevation={0}
        >
          {window?.opener || window?.parent !== window?.self ? (
            <Auth />
          ) : (
            <IdentitiesList />
          )}
        </Card>
      </Container>
    </ThemeProvider>
  );
}

export default App;
