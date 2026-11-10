import React, { useEffect, useRef, useState } from "react";
import { accentColor } from "../theme";
import { formatBytes, formatSeconds, isPhone } from "../build-stats";
import { rebuild } from "../rebuild";
import { readSession, writeSession, type RebuildLogEntry, type Rebuilt } from "../session";
import { Badge, Card, Facts, HowItWorks, Icon, NetworkPill, PageHeader, Section, Spinner } from "../ui";
import type { ViewProps } from "./meta";

export const COLORS = [
    { name: "Blue", value: "#219ef2" },
    { name: "Violet", value: "#8b5cf6" },
    { name: "Pink", value: "#ec4899" },
    { name: "Orange", value: "#f97316" },
    { name: "Green", value: "#16a34a" },
    { name: "Teal", value: "#0d9488" }
];

const colorName = (value: string) => COLORS.find((c) => c.value === value)?.name || value;

type Phase = "idle" | "building" | "done" | "error";

// A terminal-like log of the rebuild
function Log(props: { entries: RebuildLogEntry[]; running?: boolean; error?: string }) {
    return (
        <div className="rounded-lg border border-line bg-sunken px-3 py-2.5 font-mono text-[12px] leading-[1.75]" role="log" aria-live="polite">
            {props.entries.map((e, i) => {
                const current = props.running && i === props.entries.length - 1;
                return (
                    <div key={i} className="flex items-start gap-2.5">
                        <span className="w-12 shrink-0 text-right text-faint tabular-nums">{e.at.toFixed(2)}s</span>
                        <span className="mt-[3px] shrink-0">
                            {current ? <Spinner className="h-3.5 w-3.5 text-muted" /> : <Icon name="check" className="h-3.5 w-3.5 text-accent" strokeWidth={2.6} />}
                        </span>
                        <span className="min-w-0">
                            <span className="text-fg">{e.label}</span>
                            {e.detail && <span className="block break-words text-muted">{e.detail}</span>}
                        </span>
                    </div>
                );
            })}
            {props.error && (
                <div className="mt-1 flex items-start gap-2.5 text-red-600 dark:text-red-400">
                    <span className="w-12 shrink-0" />
                    <span className="shrink-0 font-bold">!</span>
                    <span className="min-w-0 break-words">{props.error} — src/theme.ts was put back.</span>
                </div>
            )}
        </div>
    );
}

function Swatch({ color }: { color: string }) {
    return <span className="inline-block h-3 w-3 shrink-0 rounded-full ring-1 ring-line-strong" style={{ background: color }} />;
}

function Result({ rebuilt }: { rebuilt: Rebuilt }) {
    const live = accentColor.toLowerCase() === rebuilt.color.toLowerCase();
    const theme = (c: string) => `export const accentColor = "${c}";`;
    return (
        <Section title="Last rebuild" hint={new Date(rebuilt.at).toLocaleString()}>
            <Card className="overflow-hidden">
                <div className="flex items-start gap-3 border-b border-line p-4">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                        <Icon name="check" className="h-4 w-4" strokeWidth={3} />
                    </span>
                    <div className="min-w-0">
                        <div className="text-[15px] font-semibold">Rebuilt on this device{rebuilt.offline ? ", offline" : ""}.</div>
                        <p className="mt-0.5 text-[13.5px] leading-snug text-muted">
                            {live
                                ? `You're looking at the new bundle: the accent is now ${colorName(rebuilt.color).toLowerCase()}, compiled into the code.`
                                : "The project was rebuilt, then rebuilt again or changed since."}
                        </p>
                    </div>
                </div>
                <div className="space-y-4 p-4">
                    <Facts
                        columns={3}
                        items={[
                            { label: "Bundle", value: formatSeconds(rebuilt.seconds), hint: "esbuild alone" },
                            { label: "Total", value: formatSeconds(rebuilt.totalSeconds), hint: "Write, plugin and bundle" },
                            { label: "Output", value: formatBytes(rebuilt.bytes), hint: rebuilt.output },
                            {
                                label: "Network during the rebuild",
                                value: <Badge tone={rebuilt.offline ? "accent" : "neutral"}>{rebuilt.offline ? "Offline" : "Online"}</Badge>
                            },
                            {
                                label: "Color",
                                value: (
                                    <span className="inline-flex items-center gap-2">
                                        <Swatch color={rebuilt.previous} /> → <Swatch color={rebuilt.color} /> {colorName(rebuilt.color)}
                                    </span>
                                )
                            },
                            { label: "Downloaded", value: "Nothing", hint: "Everything was already installed" }
                        ]}
                    />
                    <div>
                        <div className="mb-1.5 text-[12px] text-muted">The change, in src/theme.ts</div>
                        <div className="overflow-hidden rounded-lg border border-line font-mono text-[12px] leading-[1.8]">
                            <div className="overflow-x-auto bg-red-500/8 px-3 whitespace-pre text-red-700 dark:text-red-300">- {theme(rebuilt.previous)}</div>
                            <div className="overflow-x-auto bg-green-500/8 px-3 whitespace-pre text-green-700 dark:text-green-300">+ {theme(rebuilt.color)}</div>
                        </div>
                    </div>
                    <div>
                        <div className="mb-1.5 text-[12px] text-muted">Log</div>
                        <Log entries={rebuilt.log} />
                    </div>
                </div>
            </Card>
        </Section>
    );
}

function StepHead(props: { n: number; title: string; done?: boolean; children?: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3">
            <span
                className={
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold " +
                    (props.done ? "bg-accent text-white" : "border border-line-strong text-muted")
                }
            >
                {props.done ? <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} /> : props.n}
            </span>
            <span className="min-w-0 flex-1 text-[14.5px] font-semibold">{props.title}</span>
            {props.children}
        </div>
    );
}

export function Rebuild({ stats, online, rebuilt }: ViewProps) {
    const phone = isPhone(stats.platform);
    const [color, setColor] = useState(() => COLORS.find((c) => c.value !== accentColor)?.value);
    const [phase, setPhase] = useState<Phase>("idle");
    const [log, setLog] = useState<RebuildLogEntry[]>([]);
    const [error, setError] = useState("");
    const [elapsed, setElapsed] = useState(0);
    const startedAt = useRef(0);

    // running timer
    useEffect(() => {
        if (phase !== "building") return;
        let raf = 0;
        const tick = () => {
            setElapsed((performance.now() - startedAt.current) / 1000);
            raf = requestAnimationFrame(tick);
        };
        tick();
        return () => cancelAnimationFrame(raf);
    }, [phase]);

    const start = async () => {
        const offline = !online;
        startedAt.current = performance.now();
        const entries: RebuildLogEntry[] = [];
        const add = (label: string, detail?: string) => {
            entries.push({ label, detail, at: (performance.now() - startedAt.current) / 1000 });
            setLog([...entries]);
        };
        setPhase("building");
        setError("");
        try {
            const result = await rebuild(color, (step, detail) => {
                if (step === "write") add("Write src/theme.ts", `accentColor = "${color}"`);
                if (step === "bundle") add("Bundle with esbuild + @fullstacked/tailwindcss", `${stats.bundle.files} source files, from index.tsx`);
                if (step === "output") add("Write the bundle", detail);
            });
            entries[entries.length - 1].detail = `${result.output} · ${formatBytes(result.bytes)} · bundled in ${formatSeconds(result.seconds)}`;
            add("Reload on the new bundle");
            setPhase("done");
            writeSession(
                {
                    ...readSession(),
                    view: "rebuild",
                    rebuilt: {
                        color,
                        previous: result.previous || accentColor,
                        seconds: result.seconds,
                        totalSeconds: result.totalSeconds,
                        bytes: result.bytes,
                        output: result.output,
                        offline,
                        log: entries,
                        at: new Date().toISOString()
                    }
                },
                true
            );
            setTimeout(() => location.reload(), 900);
        } catch (e: any) {
            setError(String(e?.message || e).split("\n")[0]);
            setPhase("error");
        }
    };

    const busy = phase === "building" || phase === "done";

    return (
        <>
            <PageHeader
                eyebrow="Rebuild"
                title="Change it. Rebuild it. Right here."
                lead="Pick a new color: the project rewrites its own code and rebuilds itself, on this device. Even offline."
            />

            {rebuilt && <Result rebuilt={rebuilt} />}

            <Section title={rebuilt ? "Rebuild again" : "Rebuild"}>
                <Card className="divide-y divide-line">
                    <div className="p-4 md:p-5">
                        <StepHead n={1} title="Go offline (optional)" done={!online}>
                            <NetworkPill online={online} />
                        </StepHead>
                        <p className="mt-2 flex items-start gap-2 pl-9 text-[13.5px] leading-snug text-muted">
                            {phone ? "Turn on airplane mode" : "Turn off Wi-Fi or unplug the network"} to see that nothing is
                            downloaded. The status updates by itself.
                        </p>
                    </div>

                    <div className="p-4 md:p-5">
                        <StepHead n={2} title="Pick a color" done={!!color}>
                            <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
                                Now <Swatch color={accentColor} /> {colorName(accentColor)}
                            </span>
                        </StepHead>
                        <div className="mt-3 grid grid-cols-3 gap-2 pl-9 sm:grid-cols-6" role="radiogroup" aria-label="Accent color">
                            {COLORS.map((c) => {
                                const checked = color === c.value;
                                return (
                                    <button
                                        key={c.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={checked}
                                        disabled={busy}
                                        onClick={() => setColor(c.value)}
                                        className={
                                            "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-2.5 text-left text-[13px] transition-colors disabled:cursor-default disabled:opacity-60 " +
                                            (checked ? "border-transparent bg-sunken font-medium ring-2" : "border-line hover:border-line-strong")
                                        }
                                        style={checked ? ({ "--tw-ring-color": c.value } as React.CSSProperties) : undefined}
                                    >
                                        <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: c.value }} />
                                        <span className="min-w-0 truncate">{c.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-4 md:p-5">
                        <StepHead n={3} title="Rebuild on this device" done={phase === "done"} />
                        <div className="mt-3 pl-9">
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={start}
                                    disabled={!color || busy}
                                    className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 text-[14px] font-semibold text-white shadow-card transition hover:brightness-110 active:scale-[0.98] disabled:cursor-default disabled:opacity-60"
                                >
                                    {busy ? <Spinner /> : <Icon name="rebuild" className="h-4 w-4" strokeWidth={2.2} />}
                                    {phase === "done" ? "Reloading…" : busy ? "Rebuilding…" : "Rebuild on this device"}
                                </button>
                                {phase !== "idle" && (
                                    <span className="font-mono text-[13px] text-muted tabular-nums">{elapsed.toFixed(1)} s</span>
                                )}
                            </div>
                            <p className="mt-2 text-[12.5px] leading-snug text-muted">
                                Writes <code className="font-mono">src/theme.ts</code>, bundles the project, then reloads it.
                            </p>
                            {phase !== "idle" && (
                                <div className="mt-3">
                                    <Log entries={log} running={phase === "building"} error={error} />
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </Section>

            <HowItWorks title="What happens when you press Rebuild">
                <p>
                    <b>1. Write.</b> The project saves the new color into its own source file, <code>src/theme.ts</code>, with{" "}
                    <code>fs.promises.writeFile</code>: the engine at work.
                </p>
                <p>
                    <b>2. Bundle.</b> It loads the Tailwind plugin the way <code>fullstacked -p @fullstacked/tailwindcss</code>{" "}
                    does, then calls <code>bundle(".")</code> from <code>fullstacked/bundle</code>: esbuild packs the whole
                    project again into <code>out/</code>. If anything fails, the previous <code>src/theme.ts</code> is put back.
                </p>
                <p>
                    <b>3. Reload.</b> The page reloads on the new bundle. The result above travels across the reload in{" "}
                    <code>sessionStorage</code>. Nothing is downloaded at any step, which is why it works offline.
                </p>
            </HowItWorks>
        </>
    );
}
