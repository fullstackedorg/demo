import React from "react";
import { formatBytes, formatSeconds } from "../build-stats";
import { readPackages } from "../project";
import { Badge, Card, Facts, HowItWorks, Loading, Meter, PageHeader, Section, useLoad } from "../ui";
import type { ViewProps } from "./meta";

export function Packages({ stats }: ViewProps) {
    const data = useLoad(readPackages);
    const list = data?.list || [];
    const total = list.reduce((a, p) => a + p.bytes, 0);
    const max = Math.max(1, ...list.map((p) => p.bytes));

    return (
        <>
            <PageHeader
                eyebrow="Packages"
                title="All it needs, right here."
                lead="Building blocks the project uses, installed on this device. No server, no container: everything needed to run the project is installed locally."
            />

            <Section title="Install">
                <Facts
                    columns={3}
                    items={[
                        { label: "Packages", value: data ? list.length : "…", source: "lockfile" },
                        { label: "Size on disk", value: data ? formatBytes(total) : "…", source: "fs.stat" },
                        {
                            label: "Downloaded",
                            value: formatBytes(stats.install.bytes),
                            hint: `in ${formatSeconds(stats.install.seconds)}`,
                            source: "build.json"
                        },
                        { label: "Lockfile", value: <span className="font-mono text-[13px]">{data?.lockfile || "…"}</span> },
                        { label: "Registry", value: <span className="font-mono text-[13px]">registry.npmjs.org</span> },
                        { label: "Installed into", value: <span className="font-mono text-[13px]">node_modules/</span> }
                    ]}
                />
            </Section>

            <Section title="Installed packages" hint="Read from each package's own package.json; sizes added up file by file.">
                <Card className="overflow-hidden">
                    {!data ? (
                        <Loading label="Reading node_modules…" />
                    ) : !list.length ? (
                        <div className="px-4 py-6 text-[13px] text-muted">No installed packages found: run npm install first.</div>
                    ) : (
                        <ul className="divide-y divide-line">
                            {list.map((p) => (
                                <li key={p.path} className="px-4 py-3.5 md:grid md:grid-cols-[minmax(0,1fr)_160px] md:gap-6">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                            <span className="font-mono text-[13.5px] font-semibold break-all">{p.name}</span>
                                            <span className="font-mono text-[12px] text-muted">{p.version}</span>
                                            {p.direct ? (
                                                <Badge tone="accent">direct</Badge>
                                            ) : (
                                                p.requiredBy.length > 0 && <Badge>via {p.requiredBy.join(", ")}</Badge>
                                            )}
                                            {p.license && <Badge>{p.license}</Badge>}
                                        </div>
                                        <p className="mt-1 text-[13px] leading-snug text-muted">
                                            {p.description || <span className="text-faint">No description in its package.json.</span>}
                                        </p>
                                    </div>
                                    <div className="mt-2.5 md:mt-0.5">
                                        <div className="mb-1.5 flex items-baseline justify-between gap-2 font-mono text-[12px] tabular-nums">
                                            <span className="text-fg">{formatBytes(p.bytes)}</span>
                                            <span className="text-faint">{p.files} files</span>
                                        </div>
                                        <Meter value={p.bytes} max={max} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </Section>

            <div className="space-y-3">
                <HowItWorks title="What npm install did here">
                    <p>
                        npm read <code>package-lock.json</code>, the exact list of versions this project was made with. For each
                        package it downloaded a <b>tarball</b> (a compressed archive) from the npm registry over HTTPS, checked
                        it against the <b>integrity</b> checksum in the lockfile, and unpacked it into <code>node_modules/</code>.
                    </p>
                    <p>
                        npm is built into FullStacked: no Node.js to install, no server or container doing the work elsewhere.
                        Once installed, the packages stay on this device, which is why the project can rebuild offline.
                    </p>
                </HowItWorks>
                <HowItWorks title="Direct and indirect packages">
                    <p>
                        <b>Direct</b> packages are the ones the project lists in its <code>package.json</code>: React for the
                        screen, and the Tailwind CSS plugin for styles. The others come along because a direct package needs
                        them (<b>via</b>).
                    </p>
                    <p>
                        FullStacked itself is not a package here: the runtime is already on this device, and its modules
                        (<code>fullstacked/bundle</code>, <code>fullstacked/packages</code>…) are provided when the project is
                        bundled.
                    </p>
                </HowItWorks>
            </div>
        </>
    );
}
