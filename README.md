# FullStacked demo

**Build anything. Run it everywhere.**

The demo project that FullStacked's onboarding downloads, installs and bundles on the device, then opens. It is a small project inspector, about itself: the screen you see and the engine behind it, the code that does both, the packages npm installed, the bundle esbuild wrote, the device it runs on, and a rebuild that works offline. See [docs/tool.md](docs/tool.md) for the views and where their data comes from.

## Run it

You need [FullStacked](https://fullstacked.org) on a phone, a tablet or a computer, or its command line through `npx`.

```bash
npm ci
npx fullstacked -p @fullstacked/tailwindcss            # same as npm start
npx fullstacked --build -p @fullstacked/tailwindcss .  # bundle only, same as npm run build
```

`fullstacked` is deliberately **not** a dependency of this project. The onboarding installs the demo's `package-lock.json` on the device, so everything listed there is downloaded there: the command line would add its native binaries for every platform and its helpers, several times the size of the project itself. `npx fullstacked` fetches it on a computer when you need it.

The dependencies are only what ends up in the bundle: `react`, `react-dom` and the Tailwind CSS build plugin, `@fullstacked/tailwindcss`. Keep the lockfile committed and minimal: the onboarding installs from it, and from nothing else.

## Code

| | |
| :--- | :--- |
| `index.tsx` | Entry: sets the accent color, loads the build report, renders the inspector |
| `src/Inspector.tsx` | The layout: sidebar on wide screens; on phones a Settings-like home screen and views that slide in |
| `src/views/` | One file per view |
| `src/build-stats.ts` | Reads `user_data/build.json`, the onboarding's build report |
| `src/project.ts` | Reads the project on disk: file tree, packages, bundle |
| `src/excerpt.ts` | Colors the code and marks the engine (Node.js) and screen (browser) lines |
| `src/rebuild.ts` | The rebuild: writes `src/theme.ts`, bundles with the Tailwind plugin |
| `src/session.ts` | Carries the rebuild result across the reload |
| `src/network.ts` | Online or offline, live |
| `src/theme.ts` | The accent color: one exported string, rewritten by the rebuild |

## Reviewing

- Real numbers: put the onboarding's report in `user_data/build.json` (git-ignored). Without it, the stand-ins of `src/sample-build.json` are shown, with a *Sample data* note.
- `?platform=ios` (or `android`): the phone wording on a desktop.
- The open view survives a reload (session storage); open a new tab to start on the Overview.
- The rebuild rewrites `src/theme.ts`: `git checkout src/theme.ts` puts the original color back.
