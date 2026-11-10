import fs from "fs";
import os from "os";
import sample from "./sample-build.json";

// What the onboarding measured while it downloaded, installed and bundled
// this demo project on the device. It writes user_data/build.json just before
// opening the demo (same type as the onboarding's BuildReport). Every build
// number on screen comes from it; without the file (the demo was started by
// hand), the stand-ins in sample-build.json are used.
export type BuildReport = {
    version: 1;
    builtAt: string;
    directory: string;
    repository: string;
    commit: string;
    runtime: { version: string; build: string; platform: string; arch: string };
    git: {
        objects: number;
        bytes: number;
        downloaded: boolean;
        files: number;
    };
    packages: {
        count: number;
        downloaded: number;
        bytes: number;
    };
    bundle: {
        sourceFiles: number;
        bytes: number;
        outputs: { name: string; bytes: number }[];
    };
    downloadedBytes: number;
    seconds: { download: number; install: number; bundle: number; total: number };
};

// What the views use
export type Stats = {
    standIn: boolean; // sample data: no user_data/build.json
    builtAt: string;
    directory: string; // in the projects folder
    repository: string;
    commit: string;
    runtime: string;
    platform: string;
    arch: string;
    clone: { objects: number; bytes: number; files: number; seconds: number };
    install: { count: number; downloaded: number; bytes: number; seconds: number };
    bundle: {
        files: number;
        bytes: number;
        seconds: number;
        outputs: { name: string; bytes: number }[];
    };
    downloadedBytes: number;
    totalSeconds: number;
};

async function readJSON(file: string) {
    try {
        return JSON.parse(await fs.promises.readFile(file, "utf8"));
    } catch {
        return null;
    }
}

export async function loadStats(): Promise<Stats> {
    const fromFile: BuildReport = await readJSON("/user_data/build.json");
    const r = (fromFile?.version === 1 ? fromFile : sample) as BuildReport;

    const main = r.bundle.outputs?.find((o) => /\.[jt]sx?\.js$/.test(o.name));
    const stats: Stats = {
        standIn: r !== fromFile,
        builtAt: r.builtAt,
        directory: r.directory,
        repository: r.repository,
        commit: r.commit,
        runtime: `${r.runtime.version} (build ${r.runtime.build})`,
        platform: r.runtime.platform,
        arch: r.runtime.arch,
        clone: {
            objects: r.git.objects,
            bytes: r.git.bytes,
            files: r.git.files,
            seconds: r.seconds.download
        },
        install: {
            count: r.packages.count,
            downloaded: r.packages.downloaded,
            bytes: r.packages.bytes,
            seconds: r.seconds.install
        },
        bundle: {
            files: r.bundle.sourceFiles,
            bytes: main?.bytes || r.bundle.bytes,
            seconds: r.seconds.bundle,
            outputs: r.bundle.outputs || []
        },
        downloadedBytes: r.downloadedBytes,
        totalSeconds: r.seconds.total
    };

    // The live values beat the recorded ones
    try {
        stats.platform = os.platform() || stats.platform;
        stats.arch = os.arch() || stats.arch;
    } catch {}
    try {
        const v = (process as any).versions?.fullstacked;
        if (v?.major !== undefined)
            stats.runtime = `${v.major}.${v.minor}.${v.patch} (build ${v.build})`;
    } catch {}

    // for reviewing on a desktop: ?platform=ios shows the phone wording
    const forced = new URLSearchParams(location.search).get("platform");
    if (forced) stats.platform = forced;

    return stats;
}

export const isPhone = (platform: string) =>
    platform === "ios" || platform === "android";

const PLATFORM_NAMES: Record<string, string> = {
    darwin: "macOS",
    ios: "iOS",
    android: "Android",
    win32: "Windows",
    windows: "Windows",
    linux: "Linux"
};

export const platformName = (platform: string) =>
    PLATFORM_NAMES[platform] || platform;

export function formatBytes(n: number) {
    if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
    if (n < 1024) return `${n} B`;
    return `${Math.round(n / 1024)} KB`;
}

export function formatSeconds(s: number) {
    return `${s < 10 ? s.toFixed(1) : Math.round(s)} s`;
}
