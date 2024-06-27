import {
  Card,
  Container,
  CssBaseline,
  GlobalStyles,
  Snackbar,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import React from "react";
import { RouterProvider } from "react-router";
import { createBrowserRouter } from "react-router-dom";

import Auth from "./Auth";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { setMessage } from "./app/snackbar";
import "./i18n";

const theme = createTheme({
  palette: { background: { default: "#f5f5f5" } },
  typography: { button: { textTransform: "none" } },
});

const searchParams = new URLSearchParams(window.location.search);
const isAuthPage =
  window.opener ||
  searchParams.has("channel") ||
  (searchParams.has("challenge") && searchParams.has("callback_url"));

const router = createBrowserRouter([
  {
    path: "/",
    lazy: () =>
      isAuthPage
        ? Promise.resolve({ Component: Auth })
        : import("./IdentitiesList").then((module) => ({
            Component: module.default,
          })),
  },
  {
    path: "/:id",
    lazy: () =>
      import("./IdentityDetail").then((module) => ({
        Component: module.default,
      })),
  },
]);

const globalStyles = (
  <GlobalStyles
    styles={{
      "html, body, #root": {
        height: "100%",
      },
    }}
  />
);

function AppSnackbar() {
  const message = useAppSelector((state) => state.snackbar.message);
  const dispatch = useAppDispatch();

  return (
    <Snackbar
      open={message !== null}
      autoHideDuration={5000}
      onClose={() => dispatch(setMessage(null))}
      message={message}
    />
  );
}

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
          <RouterProvider router={router} />
        </Card>
      </Container>
      <AppSnackbar />
    </ThemeProvider>
  );
}

export default App;
