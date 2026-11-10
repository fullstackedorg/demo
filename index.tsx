import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { accentColor } from "./src/theme";
import { loadStats } from "./src/build-stats";
import { Inspector } from "./src/Inspector";

document.title = "FullStacked demo";
document.documentElement.style.setProperty("--accent", accentColor);

// draw under the notch and the home indicator; the bars pad themselves back
const viewport = document.querySelector('meta[name="viewport"]');
if (viewport && !/viewport-fit/.test(viewport.getAttribute("content"))) {
    viewport.setAttribute(
        "content",
        viewport.getAttribute("content") + ", viewport-fit=cover"
    );
}

const container = document.createElement("div");
document.body.append(container);

loadStats().then((stats) => createRoot(container).render(<Inspector stats={stats} />));
