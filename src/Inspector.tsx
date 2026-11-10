import React, { useEffect, useRef, useState } from "react";
import type { Stats } from "./build-stats";
import { useOnline } from "./network";
import { Rebuilt, cleanHash, readSession, writeSession } from "./session";
import { Badge, Icon, NetworkPill } from "./ui";
import { Overview } from "./views/Overview";
import { Source } from "./views/Source";
import { Packages } from "./views/Packages";
import { Bundle } from "./views/Bundle";
import { Device } from "./views/Device";
import { Rebuild } from "./views/Rebuild";
import { VIEW_META, type ViewId, type ViewProps } from "./views/meta";

const COMPONENTS: Record<ViewId, (props: ViewProps) => React.ReactNode> = {
    overview: Overview,
    source: Source,
    packages: Packages,
    bundle: Bundle,
    device: Device,
    rebuild: Rebuild
};
const VIEWS = VIEW_META;

// The FullStacked app icon (fullstacked-marketing, assets/logos/app-icon.svg),
// with the rounded corners of an app icon
function AppIcon(props: { className?: string }) {
    return (
        <svg
            viewBox="0 0 1024 1024"
            aria-hidden="true"
            className={"shrink-0 rounded-[22.5%] shadow-[0_1px_3px_rgb(0_0_0/0.25)] " + (props.className || "h-7 w-7")}
        >
            <rect width="1024" height="1024" fill="#2A95F2" />
            <g fill="#F8FAFC">
                <path d="M213.652 710.542 L511.992 883.235 L511.992 530.181 C511.992 516.412 519.305 503.672 531.221 496.788 L804.005 338.894 C818.263 330.649 818.263 309.996 804.005 301.709 L537.754 147.691 C521.812 138.456 502.213 138.456 486.271 147.691 L207.119 309.171 C195.203 316.056 187.89 328.794 187.89 342.605 L187.89 665.771 C187.89 684.24 197.71 701.308 213.652 710.542 Z" />
                <path d="M802.639 488.448 L733.482 448.345 L571.637 542.041 L571.637 659.266 L802.639 525.507 C816.864 517.281 816.864 496.674 802.639 488.448 Z" />
                <path d="M802.599 675.883 L732.786 635.451 L571.637 728.736 L571.637 846.331 L802.558 712.942 C816.783 704.716 816.824 684.11 802.558 675.842 Z" />
            </g>
        </svg>
    );
}

// the project's name as people read it: "demo" → "Demo"
function projectName(stats: Stats) {
    const name = stats.directory || "demo";
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function SampleNote(props: { className?: string }) {
    return (
        <span
            className={props.className}
            title="No user_data/build.json: the build numbers are stand-ins from src/sample-build.json."
        >
            <Badge tone="warn">Sample data</Badge>
        </span>
    );
}

function Sidebar(props: { view: ViewId; go: (v: ViewId) => void; stats: Stats; online: boolean }) {
    const groups = [...new Set(VIEWS.map((v) => v.group))];
    return (
        <aside className="pt-safe pl-safe hidden w-60 shrink-0 flex-col border-r border-line bg-panel md:flex">
            <div className="flex h-14 items-center gap-2.5 px-4">
                <AppIcon className="h-8 w-8" />
                <div className="min-w-0 leading-tight">
                    <div className="truncate text-[14px] font-semibold">{projectName(props.stats)}</div>
                    <div className="truncate text-[12px] text-muted">FullStacked project</div>
                </div>
            </div>
            <nav className="scroll-area flex-1 overflow-y-auto px-2 pt-2" aria-label="Views">
                {groups.map((g) => (
                    <div key={g} className="mb-4">
                        <div className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-faint">{g}</div>
                        {VIEWS.filter((v) => v.group === g).map((v) => {
                            const active = v.id === props.view;
                            return (
                                <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => props.go(v.id)}
                                    aria-current={active ? "page" : undefined}
                                    className={
                                        "relative mb-0.5 flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-left text-[13.5px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent " +
                                        (active
                                            ? "bg-raised font-medium text-fg shadow-card"
                                            : "text-muted hover:bg-line hover:text-fg")
                                    }
                                >
                                    <Icon name={v.icon} className={"h-[17px] w-[17px] " + (active ? "text-accent" : "")} />
                                    {v.label}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>
            <div className="pb-safe border-t border-line">
                <div className="space-y-2 px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                        <NetworkPill online={props.online} />
                        {props.stats.standIn && <SampleNote />}
                    </div>
                    <div className="truncate font-mono text-[11px] text-faint">FullStacked {props.stats.runtime}</div>
                </div>
            </div>
        </aside>
    );
}

// Phones: a standalone, Settings-like app. A home screen with the project's
// name as a large title and its views as grouped rows; a view slides in with
// a back button (and goes back with an edge swipe or the system's back).
const TILE: Record<ViewId, string> = {
    overview: "#3b82f6",
    source: "#6366f1",
    packages: "#f59e0b",
    bundle: "#14b8a6",
    device: "#64748b",
    rebuild: "var(--accent)"
};
const HOME_GROUPS: { title: string; views: ViewId[] }[] = [
    { title: "What happened", views: ["overview"] },
    { title: "Inside the project", views: ["source", "packages", "bundle"] },
    { title: "On this device", views: ["device", "rebuild"] }
];

function Home(props: { go: (v: ViewId) => void; stats: Stats; online: boolean; direction: Direction }) {
    return (
        <div className={"absolute inset-0 flex flex-col " + (props.direction === "back" ? "pop-in" : "")}>
            <main className="scroll-area pt-safe pl-safe pr-safe min-h-0 flex-1 overflow-y-auto">
                <div className="pb-content px-4">
                    <div className="flex items-center gap-3.5 pt-12 pb-6">
                        <AppIcon className="h-[60px] w-[60px]" />
                        <div className="min-w-0">
                            <h1 className="truncate text-[34px] leading-tight font-bold tracking-[-0.02em]">
                                {projectName(props.stats)}
                            </h1>
                            <p className="text-[15px] text-muted">Built and running on this device.</p>
                        </div>
                    </div>
                    {HOME_GROUPS.map((g) => (
                        <section key={g.title} className="mb-6">
                            <h2 className="px-4 pb-1.5 text-[13px] font-medium uppercase tracking-[0.04em] text-faint">
                                {g.title}
                            </h2>
                            <div className="overflow-hidden rounded-2xl border border-line bg-raised shadow-card">
                                {g.views.map((id, k) => {
                                    const v = VIEWS.find((x) => x.id === id);
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => props.go(id)}
                                            className="flex min-h-[60px] w-full cursor-pointer items-center gap-3 px-4 text-left transition-colors active:bg-line"
                                        >
                                            <span
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-white"
                                                style={{ background: TILE[id] }}
                                            >
                                                <Icon name={v.icon} className="h-[18px] w-[18px]" strokeWidth={2} />
                                            </span>
                                            <span
                                                className={
                                                    "flex min-w-0 flex-1 items-center gap-2 self-stretch py-3 " +
                                                    (k > 0 ? "border-t border-line" : "")
                                                }
                                            >
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-[16px] font-medium">
                                                        {id === "overview" ? "The story so far" : v.label}
                                                    </span>
                                                    <span className="block truncate text-[13px] text-muted">{v.blurb}</span>
                                                </span>
                                                <Icon name="chevron" className="h-4 w-4 shrink-0 text-faint" />
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                    <p className="px-4 text-center font-mono text-[11px] text-faint">FullStacked {props.stats.runtime}</p>
                </div>
            </main>
        </div>
    );
}

type Direction = "push" | "back" | "none";

function Screen(props: {
    view: ViewId;
    stats: Stats;
    online: boolean;
    back: (swiped?: boolean) => void;
    direction: Direction;
    children: React.ReactNode;
    mainRef: React.RefObject<HTMLElement>;
}) {
    const v = VIEWS.find((x) => x.id === props.view);
    // swipe from the left edge to go back, like a native app: the screen
    // follows the finger over the home screen, then slides away or snaps back
    const swipe = useRef<{ x: number; y: number; dx: number; locked?: "x" | "y" } | null>(null);
    const [drag, setDrag] = useState<{ dx: number; release?: "away" | "back" } | null>(null);
    const width = () => window.innerWidth || 390;
    const end = () => {
        const sw = swipe.current;
        swipe.current = null;
        if (!sw || sw.locked !== "x") return setDrag(null);
        if (sw.dx > Math.min(110, width() * 0.3)) {
            setDrag({ dx: width(), release: "away" });
            setTimeout(() => props.back(true), 200);
        } else {
            setDrag({ dx: 0, release: "back" });
            setTimeout(() => setDrag(null), 200);
        }
    };
    return (
        <div
            className={
                "absolute inset-0 z-10 flex flex-col bg-canvas " +
                (props.direction === "push" ? "push-in " : "") +
                (drag ? "shadow-[-12px_0_32px_rgb(0_0_0/0.25)]" : "")
            }
            style={
                drag
                    ? {
                          transform: `translateX(${drag.dx}px)`,
                          transition: drag.release ? "transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1)" : "none"
                      }
                    : undefined
            }
            onTouchStart={(e) => {
                const t = e.touches[0];
                swipe.current = t.clientX < 30 ? { x: t.clientX, y: t.clientY, dx: 0 } : null;
            }}
            onTouchMove={(e) => {
                const sw = swipe.current;
                if (!sw) return;
                const t = e.touches[0];
                const moved = t.clientX - sw.x;
                const vertical = Math.abs(t.clientY - sw.y);
                if (!sw.locked) {
                    if (Math.abs(moved) < 6 && vertical < 6) return;
                    sw.locked = Math.abs(moved) > vertical ? "x" : "y";
                }
                if (sw.locked !== "x") return;
                sw.dx = Math.max(0, moved);
                setDrag({ dx: sw.dx });
            }}
            onTouchEnd={end}
            onTouchCancel={end}
        >
            <header className="pt-safe pl-safe pr-safe shrink-0 border-b border-line bg-panel/90 backdrop-blur-xl">
                <div className="relative flex h-11 items-center px-1">
                    <button
                        type="button"
                        onClick={() => props.back()}
                        className="flex h-11 cursor-pointer items-center gap-0.5 rounded-lg pr-3 pl-1.5 text-[16px] text-accent-ink outline-none active:opacity-60"
                    >
                        <Icon name="chevron" className="h-5 w-5 rotate-180" strokeWidth={2.2} />
                        {projectName(props.stats)}
                    </button>
                    <div className="pointer-events-none absolute inset-x-24 truncate text-center text-[16px] font-semibold">
                        {v.label}
                    </div>
                </div>
            </header>
            <main ref={props.mainRef} className="scroll-area pl-safe pr-safe min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                <div className="pb-content mx-auto w-full max-w-[1040px] px-4 pt-5">{props.children}</div>
            </main>
        </div>
    );
}

// wide screens get the sidebar; phones the home screen and its views
function useWide() {
    const query = "(min-width: 768px)";
    const [wide, setWide] = useState(() => window.matchMedia?.(query).matches ?? true);
    useEffect(() => {
        const m = window.matchMedia?.(query);
        if (!m) return;
        const on = () => setWide(m.matches);
        m.addEventListener("change", on);
        return () => m.removeEventListener("change", on);
    }, []);
    return wide;
}

function DesktopBar(props: { view: ViewId; stats: Stats }) {
    const v = VIEWS.find((x) => x.id === props.view);
    return (
        <header className="pt-safe pr-safe hidden shrink-0 border-b border-line md:block">
            <div className="flex h-14 items-center gap-3 px-8">
                <div className="flex min-w-0 flex-1 items-center gap-2 text-[13.5px]">
                    <span className="text-muted">{projectName(props.stats)}</span>
                    <Icon name="chevron" className="h-3.5 w-3.5 text-faint" />
                    <span className="font-medium">{v.label}</span>
                    <span className="ml-2 hidden truncate text-faint lg:inline">{v.blurb}</span>
                </div>
                <span className="hidden font-mono text-[12px] text-faint lg:inline">
                    {props.stats.repository?.replace(/^https?:\/\//, "").replace(/\.git$/, "")}
                </span>
            </div>
        </header>
    );
}

export function Inspector({ stats }: { stats: Stats }) {
    const [session] = useState(() => readSession());
    const wide = useWide();
    const saved = VIEWS.some((v) => v.id === session.view) ? (session.view as ViewId) : null;
    // phones open on the home screen, unless a rebuild just reloaded a view
    const [view, setView] = useState<ViewId | "home">(saved ?? (wide ? "overview" : "home"));
    const [direction, setDirection] = useState<Direction>("none");
    const main = useRef<HTMLElement>(null);
    const online = useOnline(view === "rebuild" || view === "device");

    useEffect(cleanHash, []);

    // the system's back (Android, the browser) goes back to the home screen
    useEffect(() => {
        history.replaceState({ view: "home" }, "");
        if (view !== "home") history.pushState({ view }, "");
        const onPop = (e: PopStateEvent) => {
            const next = (e.state?.view as ViewId | "home") ?? "home";
            setDirection(swiped.current ? "none" : "back");
            swiped.current = false;
            setView(next);
            writeSession({ ...readSession(), view: next === "home" ? undefined : next });
        };
        window.addEventListener("popstate", onPop);
        return () => window.removeEventListener("popstate", onPop);
    }, []);

    const go = (next: ViewId) => {
        if (next === view) return;
        setDirection("push");
        if (view === "home") history.pushState({ view: next }, "");
        else history.replaceState({ view: next }, "");
        setView(next);
        writeSession({ ...readSession(), view: next });
        main.current?.scrollTo({ top: 0 });
    };
    // a swipe already showed the home screen: no slide-in for it
    const swiped = useRef(false);
    const back = (fromSwipe = false) => {
        swiped.current = fromSwipe;
        if (history.state?.view && history.state.view !== "home") history.back();
        else {
            setDirection(fromSwipe ? "none" : "back");
            setView("home");
        }
    };

    if (!wide) {
        const View = view === "home" ? null : COMPONENTS[view];
        return (
            <div className="relative h-dvh w-full overflow-hidden bg-canvas">
                {/* the home screen stays underneath: a swipe back reveals it */}
                <div aria-hidden={View ? true : undefined} inert={View ? true : undefined}>
                    <Home go={go} stats={stats} online={online} direction={View ? "none" : direction} />
                </div>
                {View && (
                    <Screen key={view} view={view as ViewId} stats={stats} online={online} back={back} direction={direction} mainRef={main}>
                        <View stats={stats} online={online} go={go} rebuilt={session.rebuilt} />
                    </Screen>
                )}
            </div>
        );
    }

    const current: ViewId = view === "home" ? "overview" : view;
    const View = COMPONENTS[current];
    return (
        <div className="flex h-dvh w-full overflow-hidden">
            <Sidebar view={current} go={go} stats={stats} online={online} />
            <div className="flex min-w-0 flex-1 flex-col">
                <DesktopBar view={current} stats={stats} />
                <main ref={main} className="scroll-area pr-safe min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                    <div key={current} className="view-in pb-content mx-auto w-full max-w-[1040px] px-8 pt-10">
                        <View stats={stats} online={online} go={go} rebuilt={session.rebuilt} />
                    </div>
                </main>
            </div>
        </div>
    );
}
