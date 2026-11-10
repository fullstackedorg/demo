import React from "react";
import { formatBytes, formatSeconds, platformName } from "../build-stats";
import { EXCERPT_FILE, readExcerpt } from "../excerpt";
import {
    API_LABELS,
    ApiDot,
    Badge,
    Card,
    Facts,
    HowItWorks,
    Icon,
    NetworkPill,
    PageHeader,
    Section,
    useLoad
} from "../ui";
import { VIEW_META, type ViewId, type ViewProps } from "./meta";

function Step(props: {
    icon: string;
    title: string;
    tool: string;
    text: React.ReactNode;
    meta: string[];
    seconds?: number;
    link: { view: ViewId; label: string };
    go: (v: ViewId) => void;
    last?: boolean;
}) {
    return (
        <li className="relative flex gap-4 pb-7 last:pb-0">
            {!props.last && <span className="absolute top-10 bottom-1 left-[17px] w-px bg-line-strong" aria-hidden="true" />}
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-raised text-accent shadow-card">
                <Icon name={props.icon} className="h-[18px] w-[18px]" />
                <span className="absolute -right-0.5 -bottom-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-white ring-2 ring-canvas">
                    <Icon name="check" className="h-2.5 w-2.5" strokeWidth={3.4} />
                </span>
            </span>
            <div className="min-w-0 flex-1 pt-1">
                <div className="flex items-baseline gap-2">
                    <h3 className="text-[15px] font-semibold">{props.title}</h3>
                    <Badge>{props.tool}</Badge>
                    {props.seconds !== undefined && (
                        <span className="ml-auto font-mono text-[12px] text-muted tabular-nums">{formatSeconds(props.seconds)}</span>
                    )}
                </div>
                <p className="mt-1 text-[14px] leading-relaxed text-muted text-pretty">{props.text}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-[12px] text-faint">{props.meta.filter(Boolean).join(" · ")}</span>
                    <button
                        type="button"
                        onClick={() => props.go(props.link.view)}
                        className="inline-flex min-h-8 cursor-pointer items-center gap-1 text-[13px] font-medium text-accent-ink hover:underline"
                    >
                        {props.link.label}
                        <Icon name="arrow" className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </li>
    );
}

export function Overview({ stats, online, go }: ViewProps) {
    const excerpt = useLoad(readExcerpt);
    const repo = stats.repository?.replace(/^https?:\/\//, "").replace(/\.git$/, "");

    return (
        <>
            <PageHeader
                eyebrow="Overview"
                title="Build anything. Run it everywhere."
                lead="Your whole project runs on this device: the screen you see and the engine behind it. Downloaded, installed and built right here, a moment ago."
            >
                {stats.standIn && (
                    <p className="mt-4 flex items-start gap-2 text-[13px] text-muted">
                        <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
                        <span>
                            Sample data: this project was started by hand, without the onboarding's report
                            (<code className="font-mono text-[12px]">user_data/build.json</code>), so the build numbers are stand-ins.
                        </span>
                    </p>
                )}
            </PageHeader>

            <Section title="What happened on this device" hint="From a GitHub link to a running project. No server, no cloud: just this device.">
                <Card className="p-5 md:p-6">
                    <ol>
                        <Step
                            icon="git"
                            title="Downloaded"
                            tool="git"
                            text={<>The project's files were copied from GitHub onto this device by git, the tool developers use to track and share code.</>}
                            meta={[repo, `${stats.clone.files} files`, formatBytes(stats.clone.bytes)]}
                            seconds={stats.clone.seconds}
                            link={{ view: "source", label: "Browse the source" }}
                            go={go}
                        />
                        <Step
                            icon="packages"
                            title="Installed"
                            tool="npm"
                            text={<>The building blocks it relies on were installed locally by npm, straight from the public npm registry.</>}
                            meta={[`${stats.install.count} packages`, formatBytes(stats.install.bytes)]}
                            seconds={stats.install.seconds}
                            link={{ view: "packages", label: "See the packages" }}
                            go={go}
                        />
                        <Step
                            icon="bundle"
                            title="Packed"
                            tool="esbuild"
                            text={<>Its code was packed into something this device can run, by esbuild, a bundler built into FullStacked.</>}
                            meta={[`${stats.bundle.files} source files`, `${formatBytes(stats.bundle.bytes)} of JavaScript`]}
                            seconds={stats.bundle.seconds}
                            link={{ view: "bundle", label: "Open the bundle" }}
                            go={go}
                        />
                        <Step
                            icon="play"
                            title="Running"
                            tool="FullStacked"
                            text={<>It opened in its own window. No server to start, no build to configure.</>}
                            meta={[`FullStacked ${stats.runtime}`, platformName(stats.platform)]}
                            link={{ view: "device", label: "About this device" }}
                            go={go}
                            last
                        />
                    </ol>
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-[13px]">
                        <span className="text-muted">
                            Downloaded in all: <span className="font-mono text-fg">{formatBytes(stats.downloadedBytes)}</span>
                        </span>
                        <span className="text-muted">
                            Total: <span className="font-mono text-fg">{formatSeconds(stats.totalSeconds)}</span>
                        </span>
                    </div>
                </Card>
            </Section>

            <Section
                title="One file. Both worlds."
                hint="Node.js and the browser together: the engine and the screen, side by side in the project's code."
                aside={
                    <button
                        type="button"
                        onClick={() => go("source")}
                        className="inline-flex min-h-9 cursor-pointer items-center gap-1 text-[13px] font-medium text-accent-ink hover:underline"
                    >
                        Open in Source <Icon name="arrow" className="h-3.5 w-3.5" />
                    </button>
                }
            >
                <Card className="overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-line bg-panel px-4 py-2.5">
                        <span className="truncate font-mono text-[12px] text-muted">{EXCERPT_FILE}</span>
                        <span className="flex shrink-0 gap-3 text-[11.5px] text-muted">
                            {(["node", "browser"] as const).map((a) => (
                                <span key={a} className="flex items-center gap-1.5">
                                    <ApiDot api={a} /> {API_LABELS[a].short}
                                </span>
                            ))}
                        </span>
                    </div>
                    <div className="py-2 font-mono text-[12.5px] leading-[1.8]">
                        {(excerpt || []).map((l, i) =>
                            l.kind === "gap" ? (
                                <div key={i} className="pl-12 text-faint">⋮</div>
                            ) : (
                                <div
                                    key={i}
                                    className="flex border-l-2 pr-4"
                                    style={{ borderColor: API_LABELS[l.api].color, background: API_LABELS[l.api].soft }}
                                >
                                    <span className="w-10 shrink-0 pr-3 text-right text-faint tabular-nums select-none">{l.n}</span>
                                    <span className="min-w-0 truncate whitespace-pre">{l.text}</span>
                                </div>
                            )
                        )}
                    </div>
                </Card>
            </Section>

            <Section title="This device">
                <Facts
                    columns={2}
                    items={[
                        { label: "Platform", value: platformName(stats.platform), source: "os.platform()", api: "node" },
                        { label: "Architecture", value: stats.arch, source: "os.arch()", api: "node" },
                        { label: "Runtime", value: `FullStacked ${stats.runtime}`, source: "process.versions", api: "node" },
                        { label: "Network", value: <NetworkPill online={online} />, source: "navigator.onLine", api: "browser" }
                    ]}
                />
            </Section>

            <Section title="Explore the project">
                <Card className="overflow-hidden">
                    <ul className="divide-y divide-line">
                        {VIEW_META.filter((v) => v.id !== "overview").map((v) => (
                            <li key={v.id}>
                                <button
                                    type="button"
                                    onClick={() => go(v.id)}
                                    className="group flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-panel"
                                >
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
                                        <Icon name={v.icon} className="h-4 w-4" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[14px] font-medium">{v.label}</span>
                                        <span className="block text-[13px] leading-snug text-muted">{v.blurb}</span>
                                    </span>
                                    <Icon name="chevron" className="h-4 w-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </Card>
            </Section>

            <HowItWorks title="What is FullStacked?">
                <p>
                    FullStacked is a <b>runtime</b> for JavaScript and TypeScript projects: the program that runs them. It
                    ships with <b>git</b> (download and track code), <b>npm</b> (install packages) and <b>esbuild</b> (pack code
                    to run) built in, so a whole project goes from a link to running without anything else installed.
                </p>
                <p>
                    A project is one codebase with both sides of a full-stack project: the <b>screen</b>, written with browser
                    APIs like <code>document</code>, and the <b>engine</b>, written with Node.js APIs like <code>fs</code> (files)
                    or <code>os</code> (the system). Both run together on the device: phones, tablets, laptops and desktops.
                </p>
            </HowItWorks>
        </>
    );
}
