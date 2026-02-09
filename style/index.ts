import fs from "fs";
import { exportStyles } from "./build.ts"

(globalThis as any).build = true

await import("../index.s.ts")
await import("../webview/counter.s.ts")

fs.writeFileSync("style.css", exportStyles());
