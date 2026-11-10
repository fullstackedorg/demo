import fs from "fs";

// Reads this project's own files on the device, with the Node.js fs module:
// the source tree, the installed packages and the bundle.

export type TreeNode = {
    name: string;
    path: string; // from the project root, no leading slash
    dir: boolean;
    children?: TreeNode[];
};

// Not part of the source: git's database, the installed packages, the bundle
// and the onboarding's report
const SKIP = new Set([".git", "node_modules", "out", "user_data"]);

export async function readTree(dir = ""): Promise<TreeNode[]> {
    let entries: { name: string; isDirectory(): boolean }[] = [];
    try {
        entries = await fs.promises.readdir("/" + dir, { withFileTypes: true });
    } catch {
        return [];
    }
    const nodes = await Promise.all(
        entries
            .filter((e) => !SKIP.has(e.name) && e.name !== ".DS_Store")
            .map(async (e) => {
                const path = dir ? `${dir}/${e.name}` : e.name;
                return e.isDirectory()
                    ? { name: e.name, path, dir: true, children: await readTree(path) }
                    : { name: e.name, path, dir: false };
            })
    );
    // folders first, then files, alphabetically
    return nodes.sort((a, b) =>
        a.dir !== b.dir ? (a.dir ? -1 : 1) : a.name.localeCompare(b.name)
    );
}

export async function readText(path: string) {
    return fs.promises.readFile("/" + path, "utf8");
}

export async function fileSize(path: string) {
    try {
        return (await fs.promises.stat("/" + path)).size;
    } catch {
        return 0;
    }
}

// The size of a folder on disk: every file in it, added up
export async function folderSize(dir: string, skipNested = false) {
    try {
        const entries = await fs.promises.readdir("/" + dir, {
            withFileTypes: true,
            recursive: true
        });
        const files = entries.filter(
            (e) =>
                e.isFile() &&
                !(skipNested && e.parentPath.slice(dir.length + 1).includes("node_modules"))
        );
        const sizes = await Promise.all(
            files.map((e) =>
                fs.promises
                    .stat(`${e.parentPath}/${e.name}`)
                    .then((s) => s.size)
                    .catch(() => 0)
            )
        );
        return { bytes: sizes.reduce((a, b) => a + b, 0), files: files.length };
    } catch {
        return { bytes: 0, files: 0 };
    }
}

async function readJSON(file: string) {
    try {
        return JSON.parse(await fs.promises.readFile(file, "utf8"));
    } catch {
        return null;
    }
}

export type Package = {
    name: string;
    path: string; // node_modules/…
    version: string;
    license: string;
    description: string;
    direct: boolean; // listed in package.json
    requiredBy: string[];
    integrity: boolean; // the lockfile pins its checksum
    bytes: number; // on disk, nested packages left out
    files: number;
};

export type Packages = { lockfile: string; list: Package[] };

const nameOf = (path: string) => path.slice(path.lastIndexOf("node_modules/") + 13);

// From the lockfile npm wrote on the device, then each package's own
// package.json for what it is
export async function readPackages(): Promise<Packages> {
    let lockfile = "node_modules/.package-lock.json";
    let lock = await readJSON("/" + lockfile);
    if (!lock) {
        lockfile = "package-lock.json";
        lock = await readJSON("/" + lockfile);
    }
    const entries = Object.entries<any>(lock?.packages || {}).filter(
        ([p, info]) => p.startsWith("node_modules/") && !info.dev && nameOf(p) !== "fullstacked"
    );
    const root = (await readJSON("/package.json")) || {};
    const direct = new Set(Object.keys(root.dependencies || {}));

    const list = await Promise.all(
        entries.map(async ([path, info]) => {
            const name = nameOf(path);
            const pkg = (await readJSON(`/${path}/package.json`)) || {};
            const size = await folderSize(path, true);
            const requiredBy = entries
                .filter(([, other]) => other.dependencies?.[name] || other.optionalDependencies?.[name])
                .map(([p]) => nameOf(p));
            if (path.split("node_modules/").length > 2) {
                const parent = path.slice(0, path.lastIndexOf("/node_modules/"));
                requiredBy.push(nameOf(parent));
            }
            return {
                name,
                path,
                version: pkg.version || info.version || "",
                license: pkg.license || info.license || "",
                description: pkg.description || "",
                direct: direct.has(name) && path === `node_modules/${name}`,
                requiredBy: [...new Set(requiredBy)],
                integrity: !!info.integrity,
                bytes: size.bytes,
                files: size.files
            } as Package;
        })
    );
    list.sort((a, b) => b.bytes - a.bytes);
    return { lockfile, list };
}

export type Output = { name: string; bytes: number };

export type Bundle = {
    outputs: Output[];
    minified: boolean | null; // null: no bundle found
    reactBuild: "production" | "development" | null;
    preview: string; // the start of the JavaScript bundle
    html: string; // out/index.html
};

export async function readBundle(): Promise<Bundle> {
    let names: string[] = [];
    try {
        names = await fs.promises.readdir("/out");
    } catch {}
    const outputs = (
        await Promise.all(
            names
                .filter((n) => !n.startsWith("."))
                .map(async (name) => {
                    try {
                        const s = await fs.promises.stat("/out/" + name);
                        return s.isFile() ? { name, bytes: s.size } : null;
                    } catch {
                        return null;
                    }
                })
        )
    )
        .filter(Boolean)
        .sort((a, b) => b.bytes - a.bytes);

    const js = outputs.find((o) => /\.[jt]sx?\.js$/.test(o.name));
    let source = "";
    try {
        if (js) source = await readText("out/" + js.name);
    } catch {}
    let html = "";
    try {
        html = await readText("out/index.html");
    } catch {}

    const lines = source ? source.split("\n").length : 0;
    const minified = source ? source.length / Math.max(1, lines) > 400 : null;
    // a development bundle keeps esbuild's "// node_modules/…" path comments
    const reactBuild = !source
        ? null
        : /react[\w-]*\.development\.js/.test(source)
          ? "development"
          : "production";

    return {
        outputs,
        minified,
        reactBuild,
        preview: source.slice(0, 1400),
        html
    };
}
