import "./webview/counter";
import "./webview/icons";
import "./webview/theme";
import "./webview/links";

import platform from "platform";
document.querySelector<HTMLSpanElement>("#platform").innerText = platform;