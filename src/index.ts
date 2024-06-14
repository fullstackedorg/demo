import "./index.css";
import "@xterm/xterm/css/xterm.css";
import "winbox/dist/css/winbox.min.css";
import { Terminal } from '@xterm/xterm';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { FitAddon } from '@xterm/addon-fit';
import { WebContainer } from "@webcontainer/api";
import clc from "cli-color";
import ansiEscape from "ansi-escape-sequences";
import WinBox from "winbox/src/js/winbox";

const main = document.createElement("main");
document.body.append(main);

const term = new Terminal();
term.loadAddon(new WebLinksAddon());
const fitAddon = new FitAddon()
term.loadAddon(fitAddon);
term.open(main);
fitAddon.fit();

window.addEventListener("resize", () => fitAddon.fit());

term.writeln(`Welcome to the ${clc.cyanBright("FullStacked Editor Demo")}\n`);

term.writeln(`This demo is possible thanks to WebContainers.io (https://webcontainers.io).\n`);

if (!(window as any).chrome) {
    term.writeln(clc.bgYellow(`\tIf the installation hangs, please try again in Google Chrome.`))
    term.writeln(clc.bgYellow(`\tWebcontainers are not fully supported in other browsers.`));
    term.writeln(clc.bgYellow(`\tMore info here: https://webcontainers.io/guides/browser-support\n`))
}

term.write(`Installing...`);
term.write(ansiEscape.cursor.horizontalAbsolute(0));

const webcontainerInstance = await WebContainer.boot();

webcontainerInstance.mount({
    "package.json": {
        file: {
            contents: JSON.stringify({
                name: "fullstacked-editor-demo",
                scripts: {
                    "start": "fullstacked"
                },
                dependencies: {
                    "@fullstacked/editor": "0.6.0"
                }
            }, null, 2)
        }
    }
});

const installProcess = await webcontainerInstance.spawn("npm", ["i"]);

installProcess.output.pipeTo(
    new WritableStream({
        write(data) {
            term.write(data);
        }
    })
);

await installProcess.exit;

term.writeln(`\n\nLaunching...`)

const runProcess = await webcontainerInstance.spawn("npx", ["fullstacked"]);

runProcess.output.pipeTo(
    new WritableStream({
        write(data) {
            term.write(data);
        }
    })
);

webcontainerInstance.on("server-ready", (port, url) => {
    if (port === 9000) {
        const iframe = document.createElement("iframe");
        iframe.id = "editor";
        document.body.append(iframe);
        iframe.onload = () => {
            term.dispose();
            main.remove();
        }
        iframe.src = url;
    } else {
        new WinBox({ 
            url,
            x: "center",
            y: "center"
        })
    }
});