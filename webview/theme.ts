import fs from "fs";
import { InputSwitch } from "@fullstacked/ui";

const lightClassName = "light";

const themeFile = "data/theme.txt";
await fs.mkdir("data");

async function loadTheme() {
    if (!(await fs.exists(themeFile))) {
        return window.matchMedia?.("(prefers-color-scheme: dark)").matches
            ? "1"
            : "0";
    }

    return fs.readFile(themeFile, { encoding: "utf8" });
}

function setDark(dark: boolean) {
    if (dark) {
        document.documentElement.classList.remove(lightClassName);
    } else {
        document.documentElement.classList.add(lightClassName);
    }
}

const themeSwitch = InputSwitch({
    label: "Dark"
});

let dark = !!parseInt(await loadTheme());

themeSwitch.input.checked = dark;
setDark(dark);
document.querySelector("header").append(themeSwitch.container);

themeSwitch.input.onchange = () => {
    dark = !dark;
    setDark(dark);
    fs.writeFile(themeFile, dark ? "1" : "0");
};
