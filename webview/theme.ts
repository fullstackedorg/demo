import fs from "fs";
// import { InputSwitch } from "@fullstacked/ui";

const lightClassName = "light";

const themeFile = "data/theme.txt";
fs.mkdirSync("data");

async function loadTheme() {
    if (!fs.existsSync(themeFile)) {
        return window.matchMedia?.("(prefers-color-scheme: dark)").matches
            ? "1"
            : "0";
    }

    return fs.readFileSync(themeFile, { encoding: "utf8" });
}

function setDark(dark: boolean) {
    if (dark) {
        document.documentElement.classList.remove(lightClassName);
    } else {
        document.documentElement.classList.add(lightClassName);
    }
}

// const themeSwitch = InputSwitch({
//     label: "Dark"
// });
const themeSwitch = {
    input: document.createElement("input")
} 
themeSwitch.input.type = "checkbox";

let dark = !!parseInt(await loadTheme());

themeSwitch.input.checked = dark;
setDark(dark);
// document.querySelector("header").append(themeSwitch.container);
document.querySelector("header").append(themeSwitch.input);

themeSwitch.input.onchange = () => {
    dark = !dark;
    setDark(dark);
    fs.writeFileSync(themeFile, dark ? "1" : "0");
};
