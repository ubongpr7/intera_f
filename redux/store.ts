// import {configureStore} from "@reduxjs/toolkit";
// import authReducer from "./features/authSlice";
// import { apiSlice } from "./services/apiSlice";
// export const makeStore = ()=>
//     configureStore({
//         reducer:{
//             [apiSlice.reducerPath]:apiSlice.reducer,
//         },
        
//         auth: authReducer,
//         middleware: getDefaultMiddleware =>
//             getDefaultMiddleware().concat(apiSlice.middleware),
//         devtools:process.NODE_ENV !=='production'
//     })

//     export type AppStore =ReturnType<typeof makeStore>;
//     export type RootState = ReturnType<AppStore['getState']>;
//     export type AppDispatch = AppStore['dispatch'];

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/authSlice";
import { apiSlice } from "./services/apiSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
      auth: authReducer,  // Make sure auth is included here
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    // devtools: process.env.NODE_ENV !== "production", // Correct usage of process.env
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
