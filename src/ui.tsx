import React, { useEffect, useState } from "react";
import type { Api } from "./excerpt";

// Loads once, on mount: null while loading
export function useLoad<T>(load: () => Promise<T>): T | null {
    const [value, setValue] = useState<T>(null);
    useEffect(() => {
        let alive = true;
        load().then((v) => alive && setValue(v));
        return () => {
            alive = false;
        };
    }, []);
    return value;
}

export function Loading(props: { label: string }) {
    return (
        <div className="flex items-center gap-2 px-4 py-6 text-[13px] text-muted">
            <Spinner /> {props.label}
        </div>
    );
}

// ── icons: 24×24 strokes, drawn here so nothing loads from the network ──────

const PATHS: Record<string, React.ReactNode> = {
    overview: (
        <>
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </>
    ),
    source: (
        <>
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5M10 13l-2 2 2 2M14 13l2 2-2 2" />
        </>
    ),
    packages: (
        <>
            <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
            <path d="m3 8 9 5 9-5M12 13v8M7.5 5.5l9 5" />
        </>
    ),
    bundle: (
        <>
            <path d="m12 3 9 4.5-9 4.5-9-4.5z" />
            <path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5" />
        </>
    ),
    device: (
        <>
            <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
            <path d="M10.5 18.5h3" />
        </>
    ),
    rebuild: (
        <>
            <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
            <path d="M4 3.5V8h4.5M4 13a8 8 0 0 0 14.3 4.9L20 16" />
            <path d="M20 20.5V16h-4.5" />
        </>
    ),
    git: (
        <>
            <circle cx="6" cy="6" r="2.2" />
            <circle cx="6" cy="18" r="2.2" />
            <circle cx="18" cy="8" r="2.2" />
            <path d="M6 8.2v7.6M18 10.2c0 4-6 3-10.3 6.4" />
        </>
    ),
    play: <path d="M7 4.5v15l12-7.5z" />,
    folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
    file: (
        <>
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
        </>
    ),
    chevron: <path d="m9 6 6 6-6 6" />,
    arrow: <path d="M5 12h14m-5-6 6 6-6 6" />,
    check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
    info: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 7.5v.5" />
        </>
    ),
    plane: <path d="M10.5 21v-2l2-1.5V13l-8 3v-2l8-5.5V4a1.5 1.5 0 0 1 3 0v4.5l8 5.5v2l-8-3v4.5l2 1.5v2l-3.5-1z" />,
    wrap: <path d="M4 6h16M4 12h13a3 3 0 0 1 0 6h-4m2-2-2 2 2 2M4 18h5" />,
    screen: (
        <>
            <rect x="3" y="4" width="18" height="13" rx="2" />
            <path d="M8 21h8M12 17v4" />
        </>
    ),
    engine: (
        <>
            <rect x="7" y="7" width="10" height="10" rx="1.5" />
            <path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4" />
        </>
    ),
    bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
};

export function Icon(props: { name: string; className?: string; strokeWidth?: number }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={props.strokeWidth || 1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={props.className || "h-4 w-4"}
        >
            {PATHS[props.name]}
        </svg>
    );
}

export function Spinner(props: { className?: string }) {
    return (
        <svg className={"animate-spin " + (props.className || "h-4 w-4")} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
    );
}

// ── page structure ─────────────────────────────────────────────────────────

export function PageHeader(props: {
    eyebrow: string;
    title: string;
    lead: React.ReactNode;
    children?: React.ReactNode;
}) {
    return (
        <header className="mb-8">
            <div className="mb-2 text-[12px] font-medium uppercase tracking-[0.08em] text-accent-ink">
                {props.eyebrow}
            </div>
            <h1 className="text-[26px] leading-[1.15] font-semibold tracking-[-0.02em] text-balance md:text-[32px]">
                {props.title}
            </h1>
            <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-muted text-pretty md:text-[16px]">
                {props.lead}
            </p>
            {props.children}
        </header>
    );
}

export function Section(props: {
    title: string;
    hint?: React.ReactNode;
    aside?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={"mb-10 " + (props.className || "")}>
            <div className="mb-3 flex items-end justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{props.title}</h2>
                    {props.hint && (
                        <p className="mt-0.5 text-[13px] leading-snug text-muted">{props.hint}</p>
                    )}
                </div>
                {props.aside && <div className="shrink-0">{props.aside}</div>}
            </div>
            {props.children}
        </section>
    );
}

export function Card(props: { children: React.ReactNode; className?: string }) {
    return (
        <div className={"rounded-xl border border-line bg-raised shadow-card " + (props.className || "")}>
            {props.children}
        </div>
    );
}

// Short labelled facts, in a grid
export type Fact = {
    label: string;
    value: React.ReactNode;
    hint?: React.ReactNode;
    source?: string; // where it was read from: os, navigator, build.json…
    api?: Api; // read by the engine or by the screen
};

export function Facts(props: { items: Fact[]; columns?: 2 | 3 }) {
    // the cells draw their right and bottom borders; the wrapper clips the
    // outer ones, so a short last row leaves no grey hole
    return (
        <div className="overflow-hidden rounded-xl border border-line bg-raised shadow-card">
            <dl className={"-mr-px -mb-px grid grid-cols-2 " + (props.columns === 3 ? "lg:grid-cols-3" : "")}>
                {props.items.map((f) => (
                    <div key={f.label} className="flex min-w-0 flex-col border-r border-b border-line px-4 py-3">
                        <dt className="text-[12px] text-muted">{f.label}</dt>
                        <dd className="mt-1 text-[15px] leading-snug font-medium break-words tabular-nums">{f.value}</dd>
                        {f.hint && <dd className="mt-0.5 text-[12px] leading-snug break-words text-muted">{f.hint}</dd>}
                        {f.source && (
                            <dd className="mt-auto flex min-w-0 items-center gap-1.5 pt-2 font-mono text-[11px] text-faint">
                                {f.api && <ApiDot api={f.api} />}
                                <span className="truncate">{f.source}</span>
                            </dd>
                        )}
                    </div>
                ))}
            </dl>
        </div>
    );
}

// "How it works": a few more technical sentences, for the curious
export function HowItWorks(props: { title?: string; children: React.ReactNode; open?: boolean }) {
    return (
        <details
            open={props.open}
            className="group rounded-xl border border-line bg-panel [&_summary::-webkit-details-marker]:hidden"
        >
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 text-[14px] font-medium select-none">
                <Icon name="chevron" className="h-4 w-4 shrink-0 text-faint transition-transform group-open:rotate-90" />
                {props.title || "How it works"}
            </summary>
            <div className="space-y-3 px-4 pb-4 pl-10 text-[14px] leading-relaxed text-muted [&_b]:font-medium [&_b]:text-fg [&_code]:font-mono [&_code]:text-[12.5px] [&_code]:text-fg">
                {props.children}
            </div>
        </details>
    );
}

export function Badge(props: {
    children: React.ReactNode;
    tone?: "neutral" | "accent" | "node" | "browser" | "warn";
    className?: string;
}) {
    const tones = {
        neutral: "border-line text-muted bg-panel",
        accent: "border-transparent bg-accent-soft text-accent-ink",
        node: "border-transparent bg-node-soft text-node",
        browser: "border-transparent bg-browser-soft text-browser",
        warn: "border-transparent bg-amber-500/12 text-amber-700 dark:text-amber-300"
    };
    return (
        <span
            className={
                "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11.5px] leading-4 font-medium whitespace-nowrap " +
                tones[props.tone || "neutral"] +
                " " +
                (props.className || "")
            }
        >
            {props.children}
        </span>
    );
}

export function NetworkPill(props: { online: boolean; className?: string }) {
    return (
        <span
            className={
                "inline-flex items-center gap-1.5 rounded-full border border-line bg-raised px-2.5 py-1 text-[12px] font-medium whitespace-nowrap " +
                (props.className || "")
            }
            aria-live="polite"
        >
            <span
                className={"h-1.5 w-1.5 rounded-full " + (props.online ? "" : "pulse-dot")}
                style={{ background: props.online ? "#22c55e" : "#f59e0b" }}
            />
            {props.online ? "Online" : "Offline"}
        </span>
    );
}

// A thin proportional bar
export function Meter(props: { value: number; max: number; tone?: string }) {
    const pct = props.max ? Math.max(2, (props.value / props.max) * 100) : 0;
    return (
        <div className="h-1 w-full overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: props.tone || "var(--accent)" }} />
        </div>
    );
}

// The engine and the screen: how the Source view names the APIs
export const API_LABELS: Record<Api, { label: string; short: string; plain: string; color: string; soft: string }> = {
    node: {
        label: "Engine (Node.js)",
        short: "Engine",
        plain: "files, the device, the network",
        color: "var(--node)",
        soft: "var(--node-soft)"
    },
    browser: {
        label: "Screen (browser)",
        short: "Screen",
        plain: "what you see and touch",
        color: "var(--browser)",
        soft: "var(--browser-soft)"
    },
    runtime: {
        label: "FullStacked",
        short: "FullStacked",
        plain: "the runtime's own tools",
        color: "var(--accent)",
        soft: "var(--accent-soft)"
    }
};

export function ApiDot(props: { api: Api }) {
    return <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: API_LABELS[props.api].color }} />;
}

export function Kbd(props: { children: React.ReactNode }) {
    return <code className="rounded bg-sunken px-1 py-0.5 font-mono text-[0.88em] text-fg">{props.children}</code>;
}
