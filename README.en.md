<p align="center">
  <img src="public/logos/VerseLight%20logo.png" alt="VerseLight" width="420">
</p>

<h1 align="center">VerseLight</h1>

<p align="center"><strong>Real-time lyric control and multi-output display for live events, worship services and streaming.</strong><br>
Prepare lyrics, cue lines and style independent outputs — entirely on your own machine.</p>

<p align="center">
  <a href="README.md">简体中文</a> ·
  <strong>English</strong>
</p>

<p align="center">
  <img alt="release" src="https://img.shields.io/badge/release-v7.0.1-2563eb?style=flat-square">
  <img alt="platform" src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-0f172a?style=flat-square">
  <img alt="license" src="https://img.shields.io/badge/license-GPL--3.0--or--later-16a34a?style=flat-square">
  <img alt="ui" src="https://img.shields.io/badge/UI-%E4%B8%AD%E6%96%87%20%2F%20English-0ea5e9?style=flat-square">
  <img alt="updates" src="https://img.shields.io/badge/auto--update-disabled-94a3b8?style=flat-square">
</p>

<p align="center">
  <a href="#build-from-source"><img alt="Build" src="https://img.shields.io/badge/%E4%BB%8E%E6%BA%90%E7%A0%81%E6%9E%84%E5%BB%BA-Build%20from%20source-0078D4?style=for-the-badge&logo=windows&logoColor=white"></a>
</p>

> **About this repository** — a personal fork of [LyricDisplay](https://github.com/PeterAlaks/lyric-display-app).
> The only changes are: **Chinese localization (Chinese by default, English switchable)**, **rebranding to VerseLight**, and **automatic updates disabled**.
> Everything else matches upstream 7.0.1. Licensed GPL-3.0-or-later; original copyright belongs to the upstream author.

## Features

| | |
|---|---|
| **Multiple outputs** | Two default lyric outputs, up to four custom outputs, a stage display and a timer display |
| **Per-output styling** | Independent typography, positioning, transitions, backgrounds, media and full-screen styling |
| **Structured songs** | Portable `.ldsong` files whose sections and slides render identically everywhere; classic text canvas retained |
| **Imports** | TXT, LRC, Markdown, RTF, DOCX; `.ldset` setlists and `.ldsch` schedules |
| **Local file management** | Keyboard-first file navigator with indexed folder search, lyric previews and recent files |
| **Lyric tooling** | Online providers (LRCLIB / Lyrics.ovh / OpenHymnal), translation grouping, timestamps, autoplay, lyric video export |
| **Live control** | Presentation clickers, `Shift + letter` section jumps, live tally, current/next status bar |
| **Reusable parts** | Write a chorus or bridge once and reference it with a bare marker; setlists can repeat a song |
| **Credits per output** | Title, writers, copyright, CCLI song number and licence number |
| **Production integrations** | OBS source creator, OBS Dock mode, generic browser URLs for vMix / Wirecast |
| **Schedule & timer** | Agenda import, manual items, transitions and ideal-end tracking |
| **Remote control** | Join-code protected mobile/web controllers and remote lyric draft approval |
| **Optional NDI** | Requires the separately installed LyricDisplay NDI companion (keeps its upstream name) |

## Build from source

Requirements: **Node.js 22+** and npm. Platform build tools are only needed when native modules must be recompiled.

```bash
git clone https://github.com/Ruanthreegold/verselight.git
cd verselight
npm install
npm run build
npm run electron-pack      # installer output in release/
```

Local development:

```bash
npm run electron-dev       # Vite (5173) + Electron, backend on 4000
```

> **No Visual Studio build tools?** `npm install` will fail while rebuilding native modules.
> Use `npm install --ignore-scripts` (better-sqlite3 ships NAPI prebuilds), copy `keytar.node`
> from the official installation, and set `"npmRebuild": false` in `package.json`'s `build` section.

## Quick start

1. Launch VerseLight and load a lyric file (TXT / LRC / DOCX…), or create a song in the canvas.
2. Configure Output 1, Output 2, Stage or a custom output.
3. Open **Output → Preview Outputs** to verify the result.
4. Enable **Display Output**, then click a lyric line to send it live.
5. In OBS, add a Browser Source:

```text
http://localhost:4000/output1
```

VerseLight must stay running while browser sources or remote controllers are in use. The packaged
build uses port `4000`; change it under **Preferences → Advanced** and restart before reusing URLs.

## Development

| Command | Purpose |
|---|---|
| `npm run electron-dev` | Full desktop development session |
| `npm run electron-dev:headless` | Development OBS Dock / headless session |
| `npm run dev` | Renderer only (Vite) |
| `npm run server` | Backend only |
| `npm run build` | Production renderer build plus build metadata |
| `npm run electron-pack` | Build and package the desktop application |
| `npm run check:static` | Syntax, conflict-marker and API contract checks |
| `npm run test:unit` | Unit test suite |

## Localization

Build-time extraction plus a runtime dictionary keeps upstream sources intact:

- `scripts/i18n-vite-plugin.js` rewrites display strings to `__t("Save")` using oxc (`rolldown/parseAst`)
  — JSX text, display props (`placeholder`/`title`/`label`/`message`…), string literals inside JSX
  expressions, and display-key object values. Comparisons, `includes()` arguments, object keys,
  class names, paths and event-callback strings are never touched.
- `src/i18n/index.js` looks up the current locale and falls back to English when a key is missing.
- `src/i18n/zh-CN.json` holds 3,700+ translations (~95% coverage of extracted strings).
- Locale is persisted in `localStorage` (default `zh-CN`) and switchable in **Preferences → General →
  Language**.
- Each build writes `.i18n-keys.json` with every extracted key so gaps are easy to find.

## FAQ

**The UI is in English.** Switch it in **Preferences → General → Language**, or check `localStorage.verselight.locale`.

**Where did “Check for updates” go?** This fork disables updates via `UPDATES_DISABLED` in `main/updater.js`. Set it to `false` and restore `build.publish` in `package.json` to re-enable.

**“This song may not be available from this provider.”** Pick results from **LRCLIB** (about three million tracks, good Chinese coverage, synced lyrics). Lyrics.ovh leans towards English pop and often returns 404 for Chinese/live versions.

## License and attribution

Licensed under the [GNU General Public License v3.0 or later](LICENSE).

- Original project: **LyricDisplay** by Peter Alakembi, with contributions from David Okaliwe and the community.
- This fork: **VerseLight** — localization, rebranding and an update toggle only.
- Lyric content remains the property of its rights holders. NDI is a trademark of Vizrt NDI AB; this project is not affiliated with or endorsed by Vizrt NDI AB.

Third-party credits: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).