import React, { useEffect, useMemo, useState } from "react";
import { formatBytes } from "../build-stats";
import { annotate, EXCERPT_FILE, languageOf, type Api, type AnnotatedLine } from "../excerpt";
import { fileSize, readText, readTree, type TreeNode } from "../project";
import { API_LABELS, ApiDot, Card, HowItWorks, Icon, Loading, PageHeader, useLoad } from "../ui";
import type { ViewProps } from "./meta";

const APIS: Api[] = ["node", "browser", "runtime"];

function Tree(props: {
    nodes: TreeNode[];
    depth?: number;
    selected: string;
    open: Set<string>;
    toggle: (path: string) => void;
    select: (path: string) => void;
}) {
    const depth = props.depth || 0;
    return (
        <ul role={depth ? "group" : "tree"} aria-label={depth ? undefined : "Project files"}>
            {props.nodes.map((n) => {
                const isOpen = props.open.has(n.path);
                const active = n.path === props.selected;
                return (
                    <li key={n.path} role="treeitem" aria-expanded={n.dir ? isOpen : undefined} aria-selected={active}>
                        <button
                            type="button"
                            onClick={() => (n.dir ? props.toggle(n.path) : props.select(n.path))}
                            className={
                                "flex h-9 w-full cursor-pointer items-center gap-1.5 rounded-md pr-2 text-left text-[13px] transition-colors lg:h-8 " +
                                (active ? "bg-accent-soft font-medium text-accent-ink" : "text-muted hover:bg-line hover:text-fg")
                            }
                            style={{ paddingLeft: 8 + depth * 14 }}
                        >
                            {n.dir ? (
                                <Icon name="chevron" className={"h-3.5 w-3.5 shrink-0 text-faint transition-transform " + (isOpen ? "rotate-90" : "")} />
                            ) : (
                                <span className="w-3.5 shrink-0" />
                            )}
                            <Icon name={n.dir ? "folder" : "file"} className={"h-4 w-4 shrink-0 " + (n.dir ? "text-faint" : "")} />
                            <span className="truncate">{n.name}</span>
                        </button>
                        {n.dir && isOpen && n.children && (
                            <Tree {...props} nodes={n.children} depth={depth + 1} />
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

function CodeLine({ line, wrap }: { line: AnnotatedLine; wrap: boolean }) {
    const [a, b] = line.apis;
    const bar = !a
        ? "transparent"
        : b
          ? `linear-gradient(${API_LABELS[a].color} 50%, ${API_LABELS[b].color} 50%)`
          : API_LABELS[a].color;
    return (
        <div className="relative flex" style={{ background: a ? API_LABELS[a].soft : undefined }}>
            <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: bar }} />
            <span className="w-11 shrink-0 pr-3 text-right text-faint tabular-nums select-none">
                {line.n}
            </span>
            <span className={"min-w-0 flex-1 pr-4 " + (wrap ? "break-words whitespace-pre-wrap" : "whitespace-pre")}>
                {line.tokens.length ? line.tokens.map((t, i) => (
                    <span key={i} className={t.t === "txt" ? undefined : "syn-" + t.t}>{t.v}</span>
                )) : " "}
            </span>
        </div>
    );
}

export function Source(_: ViewProps) {
    const tree = useLoad(() => readTree());
    const [selected, setSelected] = useState(EXCERPT_FILE);
    const [open, setOpen] = useState(() => new Set(["src"]));
    const [file, setFile] = useState<{ path: string; text: string; bytes: number } | null>(null);
    const [error, setError] = useState("");
    const [wrap, setWrap] = useState(() => window.matchMedia?.("(max-width: 767px)").matches ?? false);
    const [picker, setPicker] = useState(false); // the file tree, below lg

    useEffect(() => {
        let alive = true;
        setError("");
        Promise.all([readText(selected), fileSize(selected)])
            .then(([text, bytes]) => alive && setFile({ path: selected, text, bytes }))
            .catch((e) => alive && setError(String(e?.message || e)));
        return () => {
            alive = false;
        };
    }, [selected]);

    const lines = useMemo(() => (file ? annotate(file.text, file.path) : []), [file]);
    const counts = useMemo(() => {
        const c: Record<Api, number> = { node: 0, browser: 0, runtime: 0 };
        lines.forEach((l) => l.apis.forEach((a) => c[a]++));
        return c;
    }, [lines]);

    const toggle = (path: string) =>
        setOpen((o) => {
            const next = new Set(o);
            next.has(path) ? next.delete(path) : next.add(path);
            return next;
        });
    const select = (path: string) => {
        setSelected(path);
        setPicker(false);
    };

    const treeView = tree ? (
        <Tree nodes={tree} selected={selected} open={open} toggle={toggle} select={select} />
    ) : (
        <Loading label="Reading the project…" />
    );

    const isCode = file && languageOf(file.path) === "js";

    return (
        <>
            <PageHeader
                eyebrow="Source"
                title="One file. Both worlds."
                lead="The project's real code, read right here. Green lines run the engine, blue lines draw the screen, often in the same file."
            />

            <Card className="mb-4 overflow-hidden">
                <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
                    {/* the file tree: a column on large screens, a picker below */}
                    <div className="hidden border-r border-line bg-panel lg:block">
                        <div className="border-b border-line px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] text-faint uppercase">Files</div>
                        <div className="scroll-area max-h-[68vh] overflow-y-auto p-2">{treeView}</div>
                    </div>
                    <div className="min-w-0">
                        <button
                            type="button"
                            onClick={() => setPicker((p) => !p)}
                            aria-expanded={picker}
                            className="flex min-h-11 w-full cursor-pointer items-center gap-2 border-b border-line bg-panel px-4 text-left lg:hidden"
                        >
                            <Icon name="file" className="h-4 w-4 shrink-0 text-faint" />
                            <span className="min-w-0 flex-1 truncate font-mono text-[13px]">{selected}</span>
                            <span className="text-[12px] text-muted">{picker ? "Close" : "Files"}</span>
                            <Icon name="chevron" className={"h-4 w-4 shrink-0 text-faint transition-transform " + (picker ? "-rotate-90" : "rotate-90")} />
                        </button>
                        {picker && <div className="border-b border-line bg-panel p-2 lg:hidden">{treeView}</div>}

                        {/* the file */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-2.5">
                            <span className="hidden min-w-0 truncate font-mono text-[13px] font-medium lg:inline">{selected}</span>
                            {file && (
                                <span className="font-mono text-[12px] text-faint">
                                    {lines.length} lines · {formatBytes(file.bytes)}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => setWrap((w) => !w)}
                                aria-pressed={wrap}
                                className={
                                    "ml-auto inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-2 text-[12px] transition-colors " +
                                    (wrap ? "border-transparent bg-accent-soft text-accent-ink" : "border-line text-muted hover:text-fg")
                                }
                            >
                                <Icon name="wrap" className="h-3.5 w-3.5" /> Wrap
                            </button>
                        </div>
                        {isCode && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-b border-line px-4 py-2 text-[12px] text-muted">
                                {APIS.map((a) => (
                                    <span key={a} className={"flex items-center gap-1.5 " + (counts[a] ? "" : "opacity-45")}>
                                        <ApiDot api={a} />
                                        {API_LABELS[a].label}
                                        <span className="font-mono text-faint tabular-nums">{counts[a]}</span>
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="scroll-area max-h-[68vh] overflow-auto bg-raised py-2 font-mono text-[12.5px] leading-[1.7]">
                            {error ? (
                                <div className="px-4 py-6 text-[13px] text-muted">Could not read this file: {error}</div>
                            ) : !file ? (
                                <Loading label="Reading the file…" />
                            ) : (
                                <div className={wrap ? "" : "w-max min-w-full"}>
                                    {lines.map((l) => (
                                        <CodeLine key={l.n} line={l} wrap={wrap} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            <p className="mb-8 flex items-start gap-2 text-[13px] leading-relaxed text-muted">
                <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
                <span>
                    One file, both worlds: the engine and the screen, side by side. FullStacked runs both in the same file, on
                    this device. Accent lines use FullStacked's own tools, like its bundler.
                </span>
            </p>

            <div className="space-y-3">
                <HowItWorks title="How can one file use both?">
                    <p>
                        In a web page, <code>fs</code> (files) and <code>os</code> (the system) don't exist: browsers keep pages
                        away from the device. FullStacked provides them. When the project calls{" "}
                        <code>fs.promises.readFile</code>, the call crosses a <b>bridge</b> to FullStacked's native core, which reads
                        the file on this device and hands the result back.
                    </p>
                    <p>
                        The screen's code (<code>document</code>, <code>location</code>, <code>navigator</code>) runs in the
                        system's web view, as in any browser. Both sides share one JavaScript context, so a function can read a
                        file and update the screen on the next line, with no HTTP API in between.
                    </p>
                </HowItWorks>
                <HowItWorks title="How the lines are marked">
                    <p>
                        This view reads each file with <code>fs</code>, then looks at its imports: names imported from Node.js
                        modules (<code>fs</code>, <code>os</code>, <code>path</code>, <code>crypto</code>, <code>net</code>…) mark the
                        lines that use them, as do <code>process</code> and <code>Buffer</code>. Browser globals such as{" "}
                        <code>document</code>, <code>window</code>, <code>location</code>, <code>navigator</code> and{" "}
                        <code>localStorage</code> mark screen lines. Comments and strings are left out. The code is in{" "}
                        <code>src/excerpt.ts</code>.
                    </p>
                </HowItWorks>
            </div>
        </>
    );
}
