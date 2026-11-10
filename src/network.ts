import { useEffect, useState } from "react";

// Online or not. navigator.onLine and its events aren't reliable in every
// webview, so a quick request through the core double-checks: every few
// seconds while `watching` (the Rebuild and Device views), less often
// otherwise.
const PROBE_URL = "https://github.com/fullstackedorg/demo";

async function probe(): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    try {
        await fetch(PROBE_URL, {
            method: "HEAD",
            cache: "no-store",
            mode: "no-cors", // in a regular browser too

            signal: controller.signal
        });
        return true;
    } catch {
        return false;
    } finally {
        clearTimeout(timer);
    }
}

export function useOnline(watching: boolean) {
    const [online, setOnline] = useState(() => navigator.onLine);

    useEffect(() => {
        let alive = true;
        const check = async () => {
            if (!navigator.onLine) return alive && setOnline(false);
            const ok = await probe();
            if (alive) setOnline(ok);
        };
        const onOnline = () => check();
        const onOffline = () => setOnline(false);
        window.addEventListener("online", onOnline);
        window.addEventListener("offline", onOffline);
        check();
        const interval = setInterval(check, watching ? 4000 : 20000);
        return () => {
            alive = false;
            clearInterval(interval);
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
        };
    }, [watching]);

    return online;
}
