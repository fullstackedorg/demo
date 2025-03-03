import "./webview/counter";
import "./webview/icons";
import "./webview/theme";
import "./webview/links";
import * as UI from "@fullstacked/ui";

UI.init();

import platform from "platform";
document.querySelector<HTMLSpanElement>("#platform").innerText = platform;