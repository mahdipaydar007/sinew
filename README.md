# Sinew – Gym Tracker (Web App)

An offline-capable gym tracker that runs entirely in the browser and can be installed to your home screen as a Progressive Web App (PWA). No backend, no build step, no dependencies.

## Features

- **Home:** streak, weekly progress and your current rank.
- **Train:** log sets, reps and weight, with warm-up sets, set timers and an automatic rest timer (+15s / skip).
- **Routine:** plan a workout for each day of the week, with drag-to-reorder.
- **History:** calendar of past workouts, plus bodyweight tracking and progress charts.
- **Album:** progress photos, stored on your device.
- **Profile:** theme, account, and data export.
- **Ranks and badges:** earn higher ranks as you train.
- **Exercise library:** built-in exercises with animated stick-figure demos and form tips. An extended library of about 1,300 exercises with GIFs and step guides loads from [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) when you are online.
- **Light and dark themes**, following your system setting.
- **Screen wake lock** during workouts, and vibration when the rest timer ends (where supported).

## Files

| File | Purpose |
|---|---|
| `index.html` | App shell and tab bar |
| `style.css` | Neumorphic UI and light/dark themes |
| `data.js` | Exercise library, animated figures, rank badges, extended-library loader |
| `app.js` | App logic, rendering, storage, accounts |
| `sw.js` | Service worker (offline support) |
| `manifest.json` | PWA install metadata |
| `icon.svg`, `icon-192.png`, `icon-512.png` | App icons referenced by the manifest |

## Run locally

Service workers only work over `http://localhost` or HTTPS, so opening `index.html` directly (`file://`) will run the app without offline support. Use any static server from the project folder:

```bash
python3 -m http.server 8000
# or
npx serve .
```

Then open <http://localhost:8000>.

## Deploy

Upload the files as-is to any static host. The service worker and install prompt require HTTPS.

- **GitHub Pages:** push to a repo, then Settings → Pages → deploy from branch.
- **Netlify / Cloudflare Pages / Vercel:** drag and drop the folder, or connect the repo. No build command, and the publish directory is the project root.

All paths are relative, so the app also works from a subfolder.

## Install on your phone

- **Android (Chrome):** menu → *Install app* or *Add to Home screen*.
- **iPhone (Safari):** Share → *Add to Home Screen*.

## Offline behavior

- **App files:** network first, so updates arrive when you are online, with a cached fallback when you are offline.
- **Exercise GIFs and thumbnails:** cache first. Every GIF you have viewed once keeps working offline.
- **Extended exercise list:** cached after the first successful load.
- **Updating:** after changing any app file, bump the cache name in `sw.js` (`sinew-v9` → `sinew-v10`) so old caches are cleared.

## Your data

Everything is stored locally in the browser. Nothing is sent to a server.

- **Workouts and settings:** `localStorage`, one entry per account.
- **Photos:** `IndexedDB`.
- **Accounts:** usernames and salted password hashes, stored locally. This separates profiles on a shared device and is not server-side security.

Internal storage keys still use the app's original name (`ironclad_*`) so existing users keep their data after the rename. Don't change them unless you add a migration.

Clearing site data or uninstalling the app erases everything. Use **Profile → Export backup** (JSON) before clearing or switching devices, and **Export CSV** to analyze your sets in a spreadsheet. Backups can be imported back from the same screen.

## Browser support

Any modern evergreen browser: Chrome, Edge, Firefox, Safari 15+. Wake lock and vibration depend on the device and browser, and the app works without them.

## Credits

Extended exercise data and GIFs: [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset). Font: Nunito (Google Fonts).
