// The rebuild reloads the page on the new bundle. What the project needs to
// show the result after the reload lives in sessionStorage, with the URL hash
// as a fallback for hosts that clear it. Nothing goes to user_data/.

export type RebuildLogEntry = {
    label: string;
    detail?: string;
    at: number; // seconds since the start
};

export type Rebuilt = {
    color: string;
    previous: string; // the color src/theme.ts had before
    seconds: number; // bundle() only, as measured
    totalSeconds: number; // write + plugin + bundle
    bytes: number; // out/index.tsx.js
    output: string;
    offline: boolean; // the device was offline during the rebuild
    log: RebuildLogEntry[];
    at: string; // when, ISO date
};

export type Session = {
    view?: string;
    rebuilt?: Rebuilt;
};

const KEY = "fullstacked-demo";

export function readSession(): Session {
    try {
        const raw = sessionStorage.getItem(KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    try {
        const hash = new URLSearchParams(location.hash.slice(1));
        const s = hash.get("s");
        if (s) return JSON.parse(decodeURIComponent(s));
    } catch {}
    return {};
}

// `reload`: also in the URL hash, in case the host clears sessionStorage
export function writeSession(session: Session, reload = false) {
    const json = JSON.stringify(session);
    try {
        sessionStorage.setItem(KEY, json);
    } catch {}
    if (!reload) return;
    try {
        history.replaceState(null, "", "#s=" + encodeURIComponent(json));
    } catch {}
}

// after the reload: the hash did its job
export function cleanHash() {
    if (!location.hash) return;
    try {
        history.replaceState(null, "", location.pathname + location.search);
    } catch {}
}
