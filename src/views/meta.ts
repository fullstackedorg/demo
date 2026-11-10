import type { Stats } from "../build-stats";
import type { Rebuilt } from "../session";

export type ViewId = "overview" | "source" | "packages" | "bundle" | "device" | "rebuild";

export type ViewProps = {
    stats: Stats;
    online: boolean;
    go: (view: ViewId) => void;
    rebuilt?: Rebuilt; // the result of a rebuild, after the reload
};

export const VIEW_META: {
    id: ViewId;
    label: string;
    icon: string;
    group: string;
    blurb: string;
}[] = [
    { id: "overview", label: "Overview", icon: "overview", group: "Project", blurb: "What happened on this device" },
    { id: "source", label: "Source", icon: "source", group: "Project", blurb: "The real code, engine and screen side by side" },
    { id: "packages", label: "Packages", icon: "packages", group: "Project", blurb: "Building blocks installed on this device" },
    { id: "bundle", label: "Bundle", icon: "bundle", group: "Project", blurb: "The project packed to run here" },
    { id: "device", label: "Device", icon: "device", group: "Runtime", blurb: "Where and how the project runs" },
    { id: "rebuild", label: "Rebuild", icon: "rebuild", group: "Runtime", blurb: "Change the code and rebuild it here, even offline" }
];
