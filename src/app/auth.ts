import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const searchParams = new URLSearchParams(window.location.search);

type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];

const authSlice = createSlice({
  name: "auth",
  initialState: {
    success: null,
    hasPeerSocket: false,
    origin: null as string | null,
    username: null as string | null,
    challenge: searchParams
      .get("challenge")
      ?.replace("_", "+")
      ?.replace("-", "/"),
    callbackURL: searchParams.get("callback_url"),
    channel: searchParams.get("channel"),
    remoteConnected: false,
  },
  reducers: {
    setAuth(state, action: PayloadAction<AtLeastOne<typeof state>>) {
      Object.assign(state, action.payload);
    },
  },
});

export const { setAuth } = authSlice.actions;
export default authSlice.reducer;
