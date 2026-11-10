import fs from "fs";
import bundler from "fullstacked/bundle";
import packages from "fullstacked/packages";
import plugin from "fullstacked/plugin";

// The offline rebuild: the demo project changes one of its own source files and
// bundles itself again, on the device, with the same esbuild and Tailwind
// plugin the onboarding used. No package install: everything it needs came
// with the first install.

const THEME_FILE = "/src/theme.ts";
const TAILWIND = "@fullstacked/tailwindcss";

export type Step = "write" | "bundle" | "output" | "restart";

export type RebuildResult = {
    seconds: number; // bundle() alone
    totalSeconds: number;
    bytes: number;
    output: string;
    previous: string; // the color src/theme.ts had before
};

export function themeSource(color: string) {
    return `// The accent color of the demo project.
// The Rebuild view rewrites this file on the device, then bundles the demo
// project again: keep it a single exported string.
export const accentColor = "${color}";
`;
}

// Loads the Tailwind build plugin like \`fullstacked -p @fullstacked/tailwindcss\`
// does: resolve it from node_modules, bundle it, import it, register it.
async function registerTailwind() {
    const entry = await packages.resolve(TAILWIND, "/");
    const built = await bundler.bundleFile(entry);
    if (built.Errors?.length) throw new Error(built.Errors[0].Text);
    const file = "/" + built.OutputFiles[0].replace(/^\/+/, "");
    try {
        const mod = await import(`${file}?t=${Date.now()}`);
        return {
            registered: await plugin.register("build", mod.default || mod),
            cleanup: () => fs.promises.rm(file).catch(() => {})
        };
    } catch (e) {
        await fs.promises.rm(file).catch(() => {});
        throw e;
    }
}

export async function rebuild(
    color: string,
    onStep: (step: Step, detail?: string) => void
): Promise<RebuildResult> {
    const t0 = performance.now();

    onStep("write");
    const previous = await fs.promises.readFile(THEME_FILE, "utf8");
    await fs.promises.writeFile(THEME_FILE, themeSource(color));

    onStep("bundle");
    let tailwind: Awaited<ReturnType<typeof registerTailwind>> = null;
    let seconds = 0;
    let output = "out/index.tsx.js";
    try {
        tailwind = await registerTailwind();
        const b0 = performance.now();
        const result = await bundler.bundle(".");
        seconds = (performance.now() - b0) / 1000;
        if (result.Errors?.length) {
            const e = result.Errors[0];
            const where = e.Location ? `${e.Location.File}:${e.Location.Line}: ` : "";
            throw new Error(where + e.Text);
        }
        output =
            result.OutputFiles?.find((f) => /index\.[jt]sx?\.js$/.test(f)) ||
            output;
    } catch (e) {
        // put the previous file back: the project on disk stays the one that runs
        await fs.promises.writeFile(THEME_FILE, previous).catch(() => {});
        throw e;
    } finally {
        await tailwind?.registered.unregister().catch(() => {});
        await tailwind?.cleanup();
    }

    const stat = await fs.promises.stat("/" + output.replace(/^\/+/, ""));
    onStep("output", output);

    return {
        seconds,
        totalSeconds: (performance.now() - t0) / 1000,
        bytes: stat.size,
        output,
        previous: /"(#[0-9a-f]{3,8})"/i.exec(previous)?.[1] || ""
    };
}
