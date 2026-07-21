# jiggle-app-status

Out-of-band **force-upgrade** + **maintenance** config for Jiggle apps.

This exists **outside** the Jiggle server stack on purpose. The two things this
file controls — "your app is too old" and "we're in maintenance" — must still
work when our servers are down or being upgraded.

## Source of truth

Edit **`status.json`** (root). CI copies it to `public/status.json` on deploy.

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
| `https://<alias>.expo.app/status` | Primary — JSON with short `Cache-Control` |
| `https://<alias>.expo.app/status.json` | Static public mirror |
| `https://raw.githubusercontent.com/Jiggle-Wallet/jiggle-app-status/main/status.json` | Hardcoded client fallback |

Primary has ~60s freshness (see `app/status+api.ts`). raw.githubusercontent is ~5 min cached and is only a backup network path.

## Local development

```bash
npm install
npx expo start
# hit http://localhost:8081/status
```

## First-time Expo setup

```bash
npm install -g eas-cli
eas login
eas init          # links project + writes projectId into app.json
npx expo export --platform web
eas deploy        # first deploy; note the production URL
# or: eas deploy --prod
```

`eas.json` only needs a valid `cli` block for this hosting-only project.
There is **no** `deploy` key in `eas.json` — hosting is configured by the
CLI command (`eas deploy`), not by a schema profile.

Wire the production URL into Jiggle-V3 as:

- `EXPO_PUBLIC_APP_STATUS_URL` (primary, e.g. `https://jiggle-app-status.expo.app/status`)
- `EXPO_PUBLIC_APP_STATUS_FALLBACK_URL` (optional raw GitHub URL)

## Deploy

Push to `main` → GitHub Actions runs `eas deploy --prod` (needs `EXPO_TOKEN` secret).

Manual:

```bash
cp status.json public/status.json
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
