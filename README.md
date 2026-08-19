# jiggle-app-status

Out-of-band **force-upgrade** + **maintenance** config for Jiggle apps.

This exists **outside** the Jiggle server stack on purpose. The two things this
file controls — "your app is too old" and "we're in maintenance" — must still
work when our servers are down or being upgraded.

## Source of truth

Edit **`status.json`** (production) or **`status.preview.json`** (preview / sandbox).
CI copies them to `public/` on deploy. Never raise mins in `status.json` just to test
— that blocks production clients. Use `status.preview.json` instead.

```json
{
  "minimumVersions": { "ios": "3.0.0", "android": "3.0.0", "web": "1.0.0" },
  "recommendedVersions": { "ios": "3.1.1", "android": "3.1.1", "web": "1.0.0" },
  "storeUrls": {
    "ios": "https://apps.apple.com/app/id6446089702",
    "android": "https://play.google.com/store/apps/details?id=com.jiggle.wallet"
  },
  "maintenance": {
    "active": false,
    "message": "",
    "allowRead": true,
    "learnMoreUrl": null
  },
  "updatedAt": "2026-07-21T00:00:00.000Z"
}
```

| Field | Meaning |
|-------|---------|
| `minimumVersions.*` | Hard block below this native/store version (not OTA bundle id) |
| `recommendedVersions.*` | Soft nudge threshold (optional; apps may ignore for now) |
| `storeUrls.*` | App Store / Play Store links for force-upgrade CTA |
| `maintenance.active` | When true, apps show the maintenance screen |
| `maintenance.message` | Optional override body copy (empty → app default i18n) |
| `maintenance.allowRead` | Reserved; apps may use later for read-only mode |
| `maintenance.learnMoreUrl` | Optional external status page |

**Rules**

- Public = readable by anyone. **Never** put secrets, tokens, or PII here.
- Treat content as untrusted input in clients (schema-validate; fail-soft).
- Git history is the audit trail; `git revert` is instant rollback.
- Protect `main` with branch protection + required review (maker-checker).

## Endpoints (after EAS Hosting deploy)

| URL | Use |
|-----|-----|
| `https://jiggle-status.expo.app/status` | Production — JSON with short `Cache-Control` |
| `https://jiggle-status.expo.app/status.json` | Production static mirror |
| `https://jiggle-status.expo.app/status-preview` | Preview / sandbox (EAS profile `preview`) |
| `https://jiggle-status.expo.app/status.preview.json` | Preview static mirror |
| `https://raw.githubusercontent.com/Jiggle-Wallet/jiggle-app-status/main/status.json` | Production GitHub fallback |
| `https://raw.githubusercontent.com/Jiggle-Wallet/jiggle-app-status/main/status.preview.json` | Preview GitHub fallback |

Primary has ~60s freshness (see `app/status+api.ts`). raw.githubusercontent is ~5 min cached and is only a backup network path.

## Local development

```bash
npm install
npx expo start
# hit http://localhost:8081/status
```

## First-time Expo setup

```bash
npm install              # REQUIRED before eas init / export / deploy
eas login
eas init                 # link existing Expo project "jiggle-app-status" or create one

# Prefer project-local eas-cli (pinned) — NEVER bare `eas deploy` if PATH has an old CLI
npm run deploy:prod      # export + npx eas-cli@>=21 deploy --prod
```

**Production URL (current):** `https://jiggle-status.expo.app`  
**Status API:** `https://jiggle-status.expo.app/status`  
**Static mirror:** `https://jiggle-status.expo.app/status.json`  
**Preview API:** `https://jiggle-status.expo.app/status-preview`  
**Preview static:** `https://jiggle-status.expo.app/status.preview.json`

### `eas deploy` still says you're on 16.x after upgrading

You almost certainly have **two** `eas` binaries; the old one wins on `PATH`:

| Binary | Typical version |
|--------|-----------------|
| `/usr/local/bin/eas` | stale **16.x** (Intel/old npm global) |
| `/opt/homebrew/bin/eas` | **21.x** (Homebrew / new npm) |

```bash
which -a eas
/usr/local/bin/eas --version    # often 16.x
/opt/homebrew/bin/eas --version # 21.x

# Fix: remove the stale one, or always use the project script
rm /usr/local/bin/eas
# or: /usr/local/bin/npm uninstall -g eas-cli

# Safest — ignores PATH entirely:
cd /Volumes/MyTera/dev/jiggle/infrav3/jiggle-app-status
npm run deploy:prod
```

This hosting endpoint is **only** min-versions / maintenance JSON.  
Server softStatus (`green|amber|red`) lives on **Jiggle-Server-Web**  
`GET https://my.jigglewallet.com/main/status` — not on `jiggle-status.expo.app`.

**Common failures**

| Error | Fix |
|-------|-----|
| `Failed to resolve plugin "expo-router"` | Run `npm install` in this directory |
| `"deploy" is not allowed` in eas.json | Don't put a `deploy` key in eas.json — use `eas deploy` CLI |
| `npx expo config` non-zero | Same as missing `node_modules` |

`eas.json` only needs a valid `cli` block for this hosting-only project.
There is **no** `deploy` key in `eas.json` — hosting is configured by the
CLI command (`eas deploy`), not by a schema profile.

Wire URLs into Jiggle-V3:

- Production (defaults in `app.config.js`): `/status` + GitHub `status.json`
- Preview (EAS profile `preview` in `eas.json`): `/status-preview` + GitHub `status.preview.json`

Override locally with `EXPO_PUBLIC_APP_STATUS_URL` / `EXPO_PUBLIC_APP_STATUS_FALLBACK_URL`.

## Deploy

Push to `main` → GitHub Actions runs `eas deploy --prod` (needs `EXPO_TOKEN` secret).

Manual:

```bash
cp status.json public/status.json
cp status.preview.json public/status.preview.json
eas deploy --prod
```

## Client behaviour (Jiggle-V3)

1. On boot (and periodically), fetch primary then fallback.
2. Schema-validate. On any failure → **fail-soft** (no block, no maintenance).
3. If `maintenance.active` → full-screen maintenance (web + native).
4. If native store version `< minimumVersions[platform]` → force-upgrade to store.
5. OTA updates are separate (expo-updates) and are also forced (no "Later").
6. Pre-update/pre-upgrade path is persisted and restored after reload/reinstall session.

## Scope boundary (ADR-0004)

This file is the **bootstrap gate only** (force-upgrade + maintenance). Feature
flags, asset status, and everything else stay on the server path. Do not grow
this file into a second flag system.
