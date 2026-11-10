import fs from "fs";

// Where the engine (Node.js APIs) and the screen (browser APIs) meet in this
// project's own source: the Source view marks every line, the Overview shows
// a few real lines of src/build-stats.ts.
export const EXCERPT_FILE = "src/build-stats.ts";

// node: the engine (files, the device, the network) · browser: the screen ·
// runtime: FullStacked's own modules (fullstacked/bundle, …)
export type Api = "node" | "browser" | "runtime";

export type Token = { t: "kw" | "str" | "com" | "num" | "txt"; v: string };
export type AnnotatedLine = { n: number; tokens: Token[]; apis: Api[] };

const NODE_MODULES = [
    "fs", "fs/promises", "os", "path", "crypto", "net", "http", "https", "url",
    "zlib", "stream", "events", "buffer", "util", "child_process", "dns", "tls",
    "readline", "worker_threads", "process"
];
const NODE_GLOBALS = ["process", "Buffer"];
const BROWSER_GLOBALS = [
    "document", "window", "location", "navigator", "localStorage",
    "sessionStorage", "history", "requestAnimationFrame",
    "cancelAnimationFrame", "matchMedia", "ResizeObserver",
    "IntersectionObserver", "MutationObserver", "getComputedStyle",
    "HTMLElement", "customElements"
];
const KEYWORDS = new Set([
    "import", "from", "export", "default", "const", "let", "var", "function",
    "return", "async", "await", "if", "else", "try", "catch", "finally",
    "throw", "new", "for", "of", "in", "while", "do", "switch", "case",
    "break", "continue", "type", "interface", "as", "typeof", "instanceof",
    "true", "false", "null", "undefined", "void", "class", "extends", "this",
    "delete", "yield", "keyof", "readonly"
]);

const nodeModule = (m: string) => NODE_MODULES.includes(m.replace(/^node:/, ""));
const runtimeModule = (m: string) => /^fullstacked(\/|$)/.test(m);

export function languageOf(file: string) {
    const ext = file.split(".").pop()?.toLowerCase();
    if (["ts", "tsx", "js", "jsx", "mjs", "cjs"].includes(ext)) return "js";
    if (ext === "json") return "json";
    if (ext === "css") return "css";
    return "text";
}

// A small tokenizer, line by line, that carries block comments and template
// strings over line breaks. Good enough to color this project's own files.
function tokenize(source: string, lang: string): Token[][] {
    const lines = source.split("\n");
    if (lang === "text") return lines.map((v) => [{ t: "txt", v }]);
    let state: "code" | "block" | "template" = "code";
    return lines.map((line) => {
        const out: Token[] = [];
        const push = (t: Token["t"], v: string) => {
            if (!v) return;
            const last = out[out.length - 1];
            if (last && last.t === t) last.v += v;
            else out.push({ t, v });
        };
        let i = 0;
        let prev = ""; // last significant character, to tell a regex from a division
        while (i < line.length) {
            if (state === "block") {
                const end = line.indexOf("*/", i);
                const stop = end < 0 ? line.length : end + 2;
                push("com", line.slice(i, stop));
                if (end >= 0) state = "code";
                i = stop;
                continue;
            }
            if (state === "template") {
                let j = i;
                while (j < line.length && line[j] !== "`") j += line[j] === "\\" ? 2 : 1;
                push("str", line.slice(i, Math.min(j + 1, line.length)));
                if (j < line.length) state = "code";
                i = j + 1;
                prev = "`";
                continue;
            }
            const c = line[i];
            const rest = line.slice(i);
            if (rest.startsWith("/*")) {
                state = "block";
                continue;
            }
            if (lang !== "json" && lang !== "css" && rest.startsWith("//")) {
                push("com", rest);
                break;
            }
            if (c === '"' || c === "'") {
                let j = i + 1;
                while (j < line.length && line[j] !== c) j += line[j] === "\\" ? 2 : 1;
                push("str", line.slice(i, j + 1));
                i = j + 1;
                prev = c;
                continue;
            }
            if (c === "`" && lang === "js") {
                state = "template";
                push("str", "`");
                i++;
                continue;
            }
            if (c === "/" && lang === "js" && (prev === "" || /[(,=:[!&|?{};]/.test(prev))) {
                let j = i + 1;
                let inClass = false;
                while (j < line.length && (line[j] !== "/" || inClass)) {
                    if (line[j] === "\\") j++;
                    else if (line[j] === "[") inClass = true;
                    else if (line[j] === "]") inClass = false;
                    j++;
                }
                if (j < line.length) {
                    while (/[a-z]/.test(line[j + 1] || "")) j++;
                    push("str", line.slice(i, j + 1));
                    i = j + 1;
                    prev = "/";
                    continue;
                }
            }
            const word = /^[A-Za-z_$][\w$]*/.exec(rest);
            if (word) {
                push(lang === "js" && KEYWORDS.has(word[0]) ? "kw" : "txt", word[0]);
                i += word[0].length;
                prev = "a";
                continue;
            }
            const num = /^\d[\d_.xa-fA-F]*/.exec(rest);
            if (num && lang !== "css") {
                push("num", num[0]);
                i += num[0].length;
                prev = "1";
                continue;
            }
            push("txt", c);
            if (!/\s/.test(c)) prev = c;
            i++;
        }
        return out;
    });
}

// The names a file imports from Node.js modules and from fullstacked/*
function importedNames(source: string) {
    const node = new Set<string>();
    const runtime = new Set<string>();
    const re = /import\s+(type\s+)?([\w$\s{},*]+?)\s+from\s+["']([^"']+)["']/g;
    let m: RegExpExecArray;
    while ((m = re.exec(source))) {
        if (m[1]) continue;
        const target = nodeModule(m[3]) ? node : runtimeModule(m[3]) ? runtime : null;
        if (!target) continue;
        const clause = m[2];
        const star = /\*\s+as\s+([\w$]+)/.exec(clause);
        if (star) target.add(star[1]);
        const def = /^\s*([\w$]+)/.exec(clause.replace(/\{[^}]*\}/, ""));
        if (def) target.add(def[1]);
        const named = /\{([^}]*)\}/.exec(clause);
        named?.[1].split(",").forEach((part) => {
            const name = part.trim().split(/\s+as\s+/).pop()?.trim();
            if (name && !name.startsWith("type ")) target.add(name);
        });
    }
    return { node, runtime };
}

// `name` used as code: not a property (`a.name`), not JSX text (`<code>name</code>`)
const uses = (code: string, name: string) => {
    const id = name.replace(/\$/g, "\\$");
    return new RegExp(`(^|[^.\\w$])${id}\\b`).test(code.replace(new RegExp(`>\\s*${id}\\s*<`, "g"), "><"));
};

// Every line of a file, colored, with the APIs it uses
export function annotate(source: string, file: string): AnnotatedLine[] {
    const lang = languageOf(file);
    const tokens = tokenize(source, lang);
    const names = lang === "js" ? importedNames(source) : null;
    return tokens.map((line, i) => {
        const apis = new Set<Api>();
        if (names) {
            // imports: the module name is a string, look at the raw line
            const raw = line.map((t) => t.v).join("");
            const from = /(?:from\s+|import\s+|require\()["']([^"']+)["']/.exec(raw);
            if (from && nodeModule(from[1])) apis.add("node");
            if (from && runtimeModule(from[1])) apis.add("runtime");
            // uses: code only, comments and strings left out
            const code = line
                .filter((t) => t.t === "txt" || t.t === "kw")
                .map((t) => t.v)
                .join(" ");
            if (!from) {
                for (const n of [...names.node, ...NODE_GLOBALS])
                    if (uses(code, n)) apis.add("node");
                for (const n of names.runtime) if (uses(code, n)) apis.add("runtime");
            }
            for (const n of BROWSER_GLOBALS) if (uses(code, n)) apis.add("browser");
        }
        return { n: i + 1, tokens: line, apis: [...apis] };
    });
}

// A few real lines where both worlds meet, for the Overview
export type ExcerptLine =
    | { kind: "line"; n: number; text: string; api?: Api }
    | { kind: "gap" };

// `from`/`to` cut the line down to the expression that matters, so it fits
// on a phone; "…" marks what was left out.
const PICKS: { match: RegExp; api: Api; from?: RegExp; to?: RegExp }[] = [
    { match: /^import fs from/, api: "node" },
    { match: /fs\.promises\.readFile\(/, api: "node", from: /await fs/, to: /"utf8"\)/ },
    { match: /os\.platform\(\)/, api: "node", to: /os\.platform\(\)/ },
    { match: /location\.search/, api: "browser", from: /new URLSearchParams/, to: /location\.search\)/ }
];

function cut(text: string, from?: RegExp, to?: RegExp) {
    const start = from ? Math.max(0, text.search(from)) : 0;
    const toMatch = to ? to.exec(text) : null;
    const end = toMatch ? toMatch.index + toMatch[0].length : text.length;
    return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}

export function excerpt(source: string): ExcerptLine[] {
    const lines = source.split("\n");
    const out: ExcerptLine[] = [];
    let from = 0;
    let last = -1;
    for (const pick of PICKS) {
        const i = lines.findIndex((l, k) => k >= from && pick.match.test(l.trim()));
        if (i < 0) continue;
        if (last >= 0 && i > last + 1) out.push({ kind: "gap" });
        out.push({ kind: "line", n: i + 1, text: cut(lines[i].trim(), pick.from, pick.to), api: pick.api });
        last = i;
        from = i + 1;
    }
    return out;
}

export async function readExcerpt(): Promise<ExcerptLine[]> {
    try {
        return excerpt(await fs.promises.readFile("/" + EXCERPT_FILE, "utf8"));
    } catch {
        return [];
    }
}
