import { combineReducers, configureStore } from "@reduxjs/toolkit";

import authReducer from "./auth";
import identityReducer, { identitiesMiddleware } from "./identity";
import snackbarReducer from "./snackbar";
import authMiddleware from "./authMiddleware";

const reducers = combineReducers({
  auth: authReducer,
  identity: identityReducer,
  snackbar: snackbarReducer,
});

const store = configureStore({
  reducer: reducers,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authMiddleware, identitiesMiddleware),
});

export type AppState = ReturnType<typeof reducers>;
export type AppDispatch = typeof store.dispatch;
export default store;
