// 'use client';

// import { makeStore } from "./store";
// import { Provider } from "react-redux";

// interface Props{
//     children:React.ReactNode;
// }

// export default function StoreProvider({children}:Props){
//     const store = makeStore();
//     return <Provider store={store}>{children}</Provider>
// }
// provider.tsx (minimal changes)
'use client';

import { makeStore } from "./store";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor } from "./store";
import { useRef } from "react";

interface Props {
  children: React.ReactNode;
}

export default function StoreProvider({ children }: Props) {
  const storeRef = useRef<ReturnType<typeof makeStore>>();
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}