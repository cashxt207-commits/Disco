# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Development Commands
- **Run app:** `npm start` (launches Electron desktop app)
- **Install deps:** `npm install`
- **Build dist:** `npm run build` (requires electron-builder configured)

## Architecture

**Disco** is an Electron desktop app — a P2P decentralized Discord clone. See `PRODUCT.md` for brand guidelines.

### Process Model
- **Main process (`main.js`):** Electron window management, IPC handlers, PostgreSQL connection to Supabase via `pg`. Loads `.env` for credentials (never hardcode). Creates DB schema on startup. Handles file dialogs, media device enumeration.
- **Preload (`preload.js`):** Exposes `window.electron` API to renderer — window controls, file dialogs, image dialogs, media devices, DB queries.
- **Renderer:** Vanilla HTML/JS with custom CSS (no framework). Two pages: `login.html` (auth) and `index.html` (main app).

### Renderer Modules (all in `js/`)
- **`store.js`** — localStorage data layer. All models: users, servers, categories, channels, messages, DMs, friends, groups, voice state, nitro, boosts. Contains admin logic (`cash4xt#5792` gets auto-admin). Creates official Disco server on first login.
- **`app.js`** — Main application controller. Renders all views (servers, channels, messages, friends, DMs, settings, discovery, admin panel). Handles all user interactions.
- **`voice.js`** — WebRTC voice chat. Mic/deafen/screen share toggles. Uses `navigator.mediaDevices` for device selection.
- **`sounds.js`** — Web Audio API synthesized sound effects (join, leave, mute, deafen, message, notify).
- **`giphy.js`** — GIF search via Giphy API with Tenor fallback.
- **`emoji.js`** — Emoji data organized by category (Turkish category names).
- **`resourceWorker.js`** — Web Worker simulating P2P CPU/network resource usage.

### Data Flow
All data persists in localStorage. Supabase/PostgreSQL connection is optional — if `.env` has `DATABASE_URL`, main process connects and exposes `db-query` IPC handler. The app works fully offline without it.

### Key Design Patterns
- Server sidebar → Channel sidebar → Chat area → Member list (Discord-exact 4-panel layout)
- Modals rendered as overlay divs toggled via `App.showModal(id)` / `App.closeModals()`
- Context menus built dynamically and positioned at click coordinates
- Message polling every 3s for multi-tab simulation (not constant re-render)
- Voice state stored in localStorage; green ring indicator for speaking users

## Conventions
- **Discord-exact UI:** Colors match Discord (#313338, #2b2d31, #1e1f22, #5865f2). Layout dimensions match (72px server bar, 240px sidebars).
- **Turkish UI:** All user-facing text in Turkish.
- **SVG icons over emoji:** Use inline SVGs for UI controls, not emoji characters.
- **Admin system:** `cash4xt#5792` is auto-admin. Admin panel in settings for giving nitro, boosts, verification, admin status by user/server ID.
- **Invite links:** Format is `disco.gg/CODE` (6-char random for free, custom slug for boosted servers).
- **Nitro pricing:** Basic ₺49.99/mo, Full ₺99.99/mo (matches Discord TR pricing).
- **No hardcoded credentials:** Database URL lives in `.env`, loaded via `dotenv` in main process only.
