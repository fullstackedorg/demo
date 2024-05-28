import fs from "fs";
import esbuild from "esbuild";
import * as sass from "sass";

const { css } = sass.compile("src/index.scss", {style: process.argv.includes("--production") ? "compressed" : "expanded"})
fs.writeFileSync("src/index.css", css);

const outdir = "dist";

if (fs.existsSync(outdir))
    fs.rmSync(outdir, { recursive: true, force: true });

esbuild.buildSync({
    entryPoints: ["src/index.ts"],
    outdir,
    format: "esm",
    bundle: true,
    minify: process.argv.includes("--production"),
    sourcemap: process.argv.includes("--production") ? false : "external"
});

fs.rmSync("src/index.css");

const toCopy = [
    "src/index.html"
];

toCopy.forEach(file => {
    fs.cpSync(file, outdir + file.slice("src".length));
})