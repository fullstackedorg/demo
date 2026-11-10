# The demo project: views and data

The demo project is a project inspector about itself and the build that just ran on the device. The onboarding opens it right after it downloaded, installed and bundled this repository; the people who open it are the curious ones, so each view pairs plain words with real data.

## Wording

- Every view: a plain headline, one or two short sentences anyone understands, then the tool content (tree, code, list, table, panel). Optional *How it works* disclosures hold a few more technical sentences, each term explained.
- The browser side is **the screen** (what you see and touch); the Node.js side is **the engine** (files, the system, the network). Technical names (git, npm, esbuild, Node.js) stay visible, next to a plain explanation.
- It is "the project", "the codebase" or "the demo project", and it runs on "this device": phones, tablets, laptops and desktops.
- No exact numbers in headlines or sentences; numbers live in facts, lists and tables.
- Taglines from fullstacked.org: *Build anything. Run it everywhere.*, *No server to start, no build to configure.*, *Projects live on the device.*, *Node.js and the browser together*, *One file. Both worlds.*

## Layout

- 768 px and wider: a sidebar with the project, the views in two groups (Project, Runtime) and a live Online/Offline pill; a header with the current view; the content.
- Phones: a standalone, Settings-like app. The home screen shows the project's name as a large title and the views as grouped rows (What happened · Inside the project · On this device), each with a colored icon tile. A view slides in with a back button and its title; going back works with the button, a swipe from the left edge, or the system's back (browser history). A rebuild reloads straight onto the Rebuild screen. Safe areas, 44 px targets, no horizontal page scroll.
- Light and dark follow the system. The accent color comes from `src/theme.ts`.
- Everything is in the bundle: system fonts, inline SVG icons, no remote stylesheet. It all works offline.

## Views

| View | Shows | Data |
| :--- | :--- | :--- |
| **Overview** | What happened on this device, as a timeline: downloaded with git, installed with npm, packed with esbuild, running. A few real lines where the engine and the screen meet, a device summary, links to the other views. | `user_data/build.json`; `src/build-stats.ts` for the excerpt; `os`, `process.versions`, `navigator.onLine` |
| **Source** | The file tree (without `.git`, `node_modules`, `out`, `user_data`) and a file viewer, `src/build-stats.ts` first. Lines are marked *Engine (Node.js)*, *Screen (browser)* or *FullStacked* (its own modules), with a legend and counts. | `fs.promises.readdir` and `readFile` on the project; `src/excerpt.ts` marks the lines |
| **Packages** | Every installed package: version, license, description, direct or *via* another package, size on disk. What `npm install` did. | `node_modules/.package-lock.json`, else `package-lock.json`; each `node_modules/<name>/package.json`; sizes added up with `fs.stat` |
| **Bundle** | The files in `out/` with sizes, the build mode (production and minified, or development), React's build, the start of the JavaScript bundle, `out/index.html`. What bundling and `--build` mean. | `fs` on `out/`; `user_data/build.json` for the source files and bundle time |
| **Device** | Facts read by the engine (runtime, platform, architecture, system, projects folder) and by the screen (network, window, appearance, web engine, language), each with where it came from. Why there is no server to start. | `process.versions.fullstacked`, `os`, `user_data/build.json`, `navigator`, `window`, `matchMedia` |
| **Rebuild** | A three-step panel: go offline (optional, live pill), pick an accent color, *Rebuild on this device* with a live log. After the reload: the result, the change to `src/theme.ts`, the log, online or offline. | `src/rebuild.ts` (`fs.writeFile`, `fullstacked/bundle`, `fullstacked/packages`, `fullstacked/plugin`); `src/session.ts` |

## Build report

`user_data/build.json` is the onboarding's `BuildReport` (version 1, see `src/build-stats.ts`): repository, commit, runtime, git objects and bytes, packages, bundle outputs and the time of each step. Without it (the project was started by hand), the stand-ins in `src/sample-build.json` are used and a *Sample data* note shows. Live values (platform, architecture, runtime version) replace the recorded ones. The project writes nothing to `user_data/`.

## Rebuild

1. Write: `src/theme.ts` gets the new color (`fs.promises.writeFile`).
2. Bundle: the Tailwind plugin is resolved from `node_modules`, bundled, imported and registered, as `-p @fullstacked/tailwindcss` does; then `bundle(".")` runs esbuild over the project into `out/`. On an error, the previous `src/theme.ts` is put back.
3. Reload: the result (times, size, color before and after, the log, online or not) goes to `sessionStorage`, with the URL hash as a fallback, and the page reloads on the new bundle, opening on the Rebuild view.

Online or offline comes from `navigator.onLine` and a request to GitHub through the core: every few seconds on the Rebuild and Device views, less often elsewhere. Nothing is downloaded during a rebuild.
