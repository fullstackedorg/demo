import "./style.css";
import "fullstacked"

import os from "os"

document.title = "FullStacked Demo";

document.body.innerHTML = `
<style>
*{
-webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  }
</style>
<header></header>

        <main>
            <img src="./assets/images/app-icon.svg" />
            <h1>Welcome to FullStacked</h1>
            <p>
                Create, run and share projects built with web technologies in a
                fully cross-platform, local-first environment.
            </p>
            <p>
                You are currently running FullStacked on
                <span class="badge" id="platform"></span> platform.
            </p>
        </main>

        <div id="counter"></div>

        <nav></nav>
        `;

import("./webview/counter");
import("./webview/icons");
import("./webview/theme");
import("./webview/links");



document.querySelector<HTMLSpanElement>("#platform").innerText = os.platform();


