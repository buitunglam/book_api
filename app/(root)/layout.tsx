"use client";

import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);
const existingConfig = Amplify.getConfig();
Amplify.configure({
  ...existingConfig,
  API: {
    ...existingConfig.API,
    REST: outputs.custom.API,
  },
});

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main className="root">
          <div className="root-container">
            <div className="wrapper w-full h-full flex flex-col items-center justify-center">
              {children}
            </div>
          </div>
          <button onClick={signOut}>Sign out</button>
        </main>
      )}
    </Authenticator>
  );
};

export default Layout;
