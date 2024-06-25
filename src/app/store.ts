import { combineReducers, configureStore } from "@reduxjs/toolkit";

import identityReducer, { identitiesMiddleware } from "./identity";
import snackbarReducer from "./snackbar";

const reducers = combineReducers({
  identity: identityReducer,
  snackbar: snackbarReducer,
});

const store = configureStore({
  reducer: reducers,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(identitiesMiddleware),
});

export type AppState = ReturnType<typeof reducers>;
export type AppDispatch = typeof store.dispatch;
export default store;
