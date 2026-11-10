import React, { useEffect, useState } from "react";
import os from "os";
import { platformName } from "../build-stats";
import { API_LABELS, ApiDot, Card, Facts, HowItWorks, Icon, NetworkPill, PageHeader, Section } from "../ui";
import type { ViewProps } from "./meta";

function safe(read: () => string) {
    try {
        return read() || "";
    } catch {
        return "";
    }
}

function webEngine() {
    const ua = navigator.userAgent;
    if (/Firefox\//.test(ua)) return "Gecko";
    if (/Chrom(e|ium)\//.test(ua)) return "Chromium";
    if (/AppleWebKit\//.test(ua)) return "WebKit";
    return "Unknown";
}

function useScreen() {
    const read = () => ({
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
        dark: window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
    });
    const [screen, setScreen] = useState(read);
    useEffect(() => {
        const update = () => setScreen(read());
        window.addEventListener("resize", update);
        const media = window.matchMedia?.("(prefers-color-scheme: dark)");
        media?.addEventListener?.("change", update);
        return () => {
            window.removeEventListener("resize", update);
            media?.removeEventListener?.("change", update);
        };
    }, []);
    return screen;
}

function Box(props: { icon: string; title: string; lines: string[]; tone: string }) {
    return (
        <div className="min-w-0 flex-1 rounded-xl border border-line bg-raised p-4 shadow-card">
            <div className="flex items-center gap-2.5">
                <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `color-mix(in oklab, ${props.tone} 14%, transparent)`, color: props.tone }}
                >
                    <Icon name={props.icon} className="h-4 w-4" />
                </span>
                <span className="text-[14px] font-semibold">{props.title}</span>
            </div>
            <ul className="mt-3 space-y-1.5">
                {props.lines.map((l) => (
                    <li key={l} className="flex items-start gap-2 text-[13px] leading-snug text-muted">
                        <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-faint" />
                        {l}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function Device({ stats, online }: ViewProps) {
    const screen = useScreen();
    const system = [safe(() => os.type()), safe(() => os.release())].filter(Boolean).join(" ");

    return (
        <>
            <PageHeader
                eyebrow="Device"
                title="It's alive. No server, no cloud."
                lead="Projects live on the device. They can save files, reach servers and use this device, like real software, not just a web page."
            />

            <Section
                title="Read by the engine"
                hint={<span className="inline-flex items-center gap-1.5"><ApiDot api="node" /> Node.js APIs, answered by this device.</span>}
            >
                <Facts
                    columns={3}
                    items={[
                        { label: "Runtime", value: `FullStacked ${stats.runtime}`, source: "process.versions", api: "node" },
                        { label: "Platform", value: platformName(stats.platform), hint: stats.platform, source: "os.platform()", api: "node" },
                        { label: "Architecture", value: stats.arch, source: "os.arch()", api: "node" },
                        ...(system ? [{ label: "System", value: system, source: "os.type()", api: "node" as const }] : []),
                        {
                            label: "Projects folder",
                            value: <span className="font-mono text-[13px]">{stats.directory || "demo"}/</span>,
                            hint: "Where this project lives on the device",
                            source: "build.json"
                        },
                        {
                            label: "Built",
                            value: stats.builtAt ? new Date(stats.builtAt).toLocaleString() : "—",
                            source: "build.json"
                        }
                    ]}
                />
            </Section>

            <Section
                title="Read by the screen"
                hint={<span className="inline-flex items-center gap-1.5"><ApiDot api="browser" /> Browser APIs, in the same JavaScript context.</span>}
            >
                <Facts
                    columns={3}
                    items={[
                        { label: "Network", value: <NetworkPill online={online} />, hint: "Checked every few seconds", source: "navigator.onLine", api: "browser" },
                        { label: "Window", value: `${screen.width} × ${screen.height}`, hint: `Pixel ratio ${screen.ratio}`, source: "window", api: "browser" },
                        { label: "Appearance", value: screen.dark ? "Dark" : "Light", source: "matchMedia", api: "browser" },
                        { label: "Web engine", value: webEngine(), hint: "Draws the screen", source: "navigator", api: "browser" },
                        { label: "Language", value: navigator.language || "—", source: "navigator", api: "browser" }
                    ]}
                />
            </Section>

            <Section title="No server to start" hint="The screen and the engine run together, in one place, bridged to FullStacked's native core.">
                <Card className="p-4 md:p-5">
                    <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
                        <Box
                            icon="screen"
                            title="Your project"
                            tone="var(--accent)"
                            lines={["One JavaScript context", `${API_LABELS.browser.label}: what you see`, `${API_LABELS.node.label}: the logic`]}
                        />
                        <div className="flex shrink-0 items-center justify-center gap-2 py-1 text-[12px] font-medium text-muted md:flex-col md:px-1">
                            <svg viewBox="0 0 48 12" className="h-3 w-12 rotate-90 text-faint md:rotate-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M2 6h44M40 1.5 46 6l-6 4.5M8 1.5 2 6l6 4.5" />
                            </svg>
                            bridge
                        </div>
                        <Box
                            icon="engine"
                            title="FullStacked core"
                            tone="var(--node)"
                            lines={["Native code on this device", "Files, network, system", "git, npm and esbuild"]}
                        />
                    </div>
                </Card>
            </Section>

            <HowItWorks title="Why there is no server">
                <p>
                    In a usual full-stack setup, the screen runs in a browser and the engine runs on a <b>server</b>, somewhere
                    else; they talk over HTTP, so a server has to be started, hosted and kept up.
                </p>
                <p>
                    In FullStacked, both run in one JavaScript context in this device's web view. When the code calls{" "}
                    <code>fs</code> or <code>os</code>, the call goes over a <b>bridge</b>, a direct channel to FullStacked's
                    native core, which does the work on this device and answers. Nothing listens on a port, and nothing leaves
                    the device unless the project asks for it.
                </p>
            </HowItWorks>
        </>
    );
}
