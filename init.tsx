import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./src/App";

export default function (openTerminal?: (dontShowAgain: boolean) => void) {
    document.title = "Welcome to FullStacked";
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    root.render(
        <App
            openTerminal={
                openTerminal
                    ? (dontShowAgain) => {
                          root.unmount();
                          container.remove();
                          openTerminal(dontShowAgain);
                      }
                    : null
            }
        />
    );
}
