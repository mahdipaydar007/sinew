# Sinew – Gym Tracker

Sinew is a gym tracker that runs entirely on your device: log sets, follow a weekly routine, track bodyweight and progress photos, and earn ranks as you train. It ships in two forms from the **same code**:

- **Web app (PWA):** open it in a browser, or install it to your home screen.
- **Android app (APK):** the same app wrapped with [Capacitor](https://capacitorjs.com), built for you by GitHub or on your own machine.

No backend, no accounts on a server, no tracking. Your data never leaves your device.

---

## Project structure

```
sinew/
├── www/                      The app itself (this is the web version)
│   ├── index.html            App shell and tab bar
│   ├── style.css             Neumorphic UI, light/dark themes
│   ├── data.js               Exercise library, animated figures, rank badges, extended-library loader
│   ├── app.js                App logic, rendering, storage, accounts, exports
│   ├── sw.js                 Service worker (offline support)
│   ├── manifest.json         PWA install metadata
│   └── icon.svg, icon-192.png, icon-512.png
├── assets/
│   └── icon-only.png         1024×1024 source for the Android launcher icons
├── .github/workflows/
│   └── build-apk.yml         GitHub Actions job that builds the APK in the cloud
├── capacitor.config.json     Android wrapper settings (app name, package id, web folder)
├── package.json              Capacitor dependencies
├── build.sh                  One-command APK build (used by the workflow and locally)
├── .gitignore                Ignores node_modules/, android/, dist/
└── README.md                 This file
```

Folders created later and not committed:

| Folder | Created by | Contains |
|---|---|---|
| `node_modules/` | `npm install` | Dependencies |
| `android/` | `npx cap add android` (inside `build.sh`) | The generated native Android project |
| `dist/` | `build.sh` | The finished `Sinew.apk` |

**Rule of thumb:** edit things in `www/`. Everything else is build plumbing.

---

## Features

- **Home:** streak, weekly progress, current rank.
- **Train:** log sets, reps and weight; warm-up sets; set timers; automatic rest timer (+15s / skip).
- **Routine:** plan a workout for each day of the week, with drag-to-reorder.
- **History:** workout calendar, bodyweight tracking, progress charts.
- **Album:** progress photos stored on your device.
- **Profile:** theme, account, backup and export.
- **Ranks and badges** that unlock as you train.
- **Exercise library:** built-in exercises with animated stick-figure demos and form tips, plus an extended library of about 1,300 exercises with GIFs and step guides from [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset), loaded when you are online.
- Light and dark themes, screen wake lock during workouts, vibration when rest ends (where supported).

---

## Web version

### Run locally

Service workers need `http://localhost` or HTTPS, so don't open `index.html` by double-click (`file://`); the app runs but without offline support. From the `www/` folder:

```bash
cd www
python3 -m http.server 8000
# or: npx serve .
```

Open <http://localhost:8000>.

### Deploy

Upload the contents of `www/` to any static host. HTTPS is required for install and offline support.

- **GitHub Pages:** push the files, then Settings → Pages → deploy from branch (set the folder to `/www`, or copy `www/` contents to the repo root).
- **Netlify / Cloudflare Pages / Vercel:** drag and drop `www/`, or connect the repo with no build command and `www` as the publish directory.

All paths are relative, so it also works from a subfolder.

### Install on your phone

- **Android (Chrome):** menu → *Install app* or *Add to Home screen*.
- **iPhone (Safari):** Share → *Add to Home Screen*.

### Browser support

Modern evergreen browsers: Chrome, Edge, Firefox, Safari 15+. Wake lock and vibration depend on the device and the app works without them.

---

## Android version (APK)

The APK contains all the files from `www/`, so the app works offline. Exercise GIFs still need internet the first time each one is viewed, then stay cached.

### Option A – build in the cloud (nothing to install)

1. Create a free GitHub repository and upload the whole project, **including the hidden `.github` folder**. On the GitHub website, drag the folders in rather than picking files.
2. Open the **Actions** tab → **Build Android APK** → **Run workflow**. It also runs automatically on every push to `main` or `master`.
3. Wait about 5 minutes. Open the finished run and download the **Sinew-apk** artifact.
4. Unzip it to get `Sinew.apk`, copy it to your phone and open it. Allow *Install unknown apps* when Android asks.

What the workflow does: starts a clean Linux machine, installs Node 20, Java 21 and the Android SDK, runs `build.sh`, and saves the APK as a downloadable artifact.

### Option B – build on your own computer

Requirements: Node 20+, JDK 21, and the Android SDK (via Android Studio or command-line tools) with `ANDROID_HOME` set.

```bash
bash build.sh
```

Output: `dist/Sinew.apk`.

`build.sh` installs dependencies, generates the `android/` project on first run, adds camera/vibrate/wake-lock permissions, generates launcher icons from `assets/icon-only.png`, syncs `www/` into the app, and runs Gradle.

### About the APK

- It is a **debug build**, signed with Android's debug key. That is fine for installing on your own devices but cannot be uploaded to the Play Store.
- **Export backup** and **Export CSV** open the Android share sheet inside the app (Android WebViews ignore normal browser downloads). In a regular browser they download as usual.

### Publishing to the Play Store (optional)

1. Create a keystore: `keytool -genkey -v -keystore sinew.jks -keyalg RSA -keysize 2048 -validity 10000 -alias sinew`
2. Open the generated `android/` folder in Android Studio and configure signing.
3. Build a signed bundle: Build → Generate Signed Bundle / APK, or `cd android && ./gradlew bundleRelease`.
4. Keep the keystore and its passwords safe. You need the same key for every future update.

Before publishing, change the package id `app.sinew.gym` in `capacitor.config.json` if you want your own, and run a trademark search on the name "Sinew".

---

## Changing the app

1. Edit files in `www/`.
2. Web: re-upload to your host. Bump the cache name in `www/sw.js` (`sinew-v9` → `sinew-v10`) so old caches are cleared.
3. Android: rebuild with Option A or B.

To change the launcher icon, replace `assets/icon-only.png` (1024×1024) and rebuild. To change the web/PWA icons, replace the files in `www/`.

To change the app name or package id, edit `capacitor.config.json`.

---

## Your data

Everything is stored locally. Nothing is sent to a server.

| Data | Where |
|---|---|
| Workouts, routines, settings | `localStorage`, one entry per account |
| Progress photos | `IndexedDB` |
| Accounts | Usernames and salted password hashes, local only. This separates profiles on a shared device and is not server-side security. |

- **Backup:** Profile → **Export backup** (JSON). Restore with **Import backup** on the same screen. **Export CSV** gives you sets for spreadsheet analysis.
- **Data loss:** clearing site data, clearing app storage or uninstalling the Android app erases everything. Export a backup first.
- **Reinstalling the Android app** (or moving from web to APK): the two have separate storage, so move data with Export and Import backup.
- **Storage keys:** internal keys still use the app's original name (`ironclad_*`) so existing users keep their data after the rename. Don't change them without writing a migration.

---

## Offline behavior

- **App files:** network first (updates arrive when online), cached fallback when offline.
- **Exercise GIFs and thumbnails:** cache first, so every GIF you've viewed keeps working offline.
- **Extended exercise list:** cached after the first successful load.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Workflow doesn't appear in Actions | The `.github/workflows/build-apk.yml` file wasn't uploaded. Re-upload the hidden folder. |
| Cloud build fails | Open the failed run, expand the failing step and read the error. |
| Phone blocks the APK | Allow *Install unknown apps* for the app you opened it from (Files, Chrome, etc.). |
| Web app won't go offline | It must be served over `http://localhost` or HTTPS, not `file://`. |
| Exercise GIFs don't load | They need internet the first time; check your connection. |
| Data missing after update | Check that you are using the same app (web and APK store data separately) and import a backup. |

---

## Credits

Extended exercise data and GIFs: [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset). Font: Nunito (Google Fonts). Android wrapper: [Capacitor](https://capacitorjs.com).
