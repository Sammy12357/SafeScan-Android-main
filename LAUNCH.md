# SafeScan dApp Store Launch Checklist

Everything the engineering side has shipped is listed in the main README. This
file is the **operator** checklist — accounts, keys, store assets, and the
publish sequence. None of these can be automated from inside the repo.

## 1. Accounts you need before publishing

- [ ] **Solana publisher wallet** funded with ~0.05 SOL for the on-chain
      publisher / app / release accounts.
      Generate with `solana-keygen new --outfile dapp-store/publisher.json`.
      **Back this keypair up offline.** Losing it means losing publish rights.
- [ ] **Expo account** with EAS project access (this repo already references
      project `bd703b1e-4182-442c-8d98-40bb95007490`).
- [ ] **Auth0 tenant** for production Google sign-in (or migrate off the
      `dev-vnllaqnkkegs4xni` tenant baked in as the default in
      `hooks/useGoogleAuth.ts`).
- [ ] **Support email inbox** that actually receives mail
      (`support@safescan.app` is currently used in `ErrorBoundary` and
      `dapp-store/config.yaml`).
- [ ] **Live Privacy Policy + Terms URLs**. The app links to
      `https://safescan-qr.onrender.com/legal/privacy` and `/legal/terms` —
      confirm these are reachable from a desktop browser. Solana review will
      reject the submission if they 404.

## 2. Production secrets to set

Create `.env.production` (or set EAS secrets) with:

```
EXPO_PUBLIC_API_BASE_URL=https://safescan-qr.onrender.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<prod Google client id>
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=<prod Android client id>
EXPO_PUBLIC_AUTH0_DOMAIN=<prod Auth0 domain>
EXPO_PUBLIC_AUTH0_CLIENT_ID=<prod Auth0 client id>
```

`eas secret:create --scope project --name EXPO_PUBLIC_AUTH0_CLIENT_ID --value "..."`

**Do NOT add a `EXPO_PUBLIC_ADMIN_EMAILS`** — anything prefixed
`EXPO_PUBLIC_` ships in the bundle. Admin role is set server-side now (see
`SECURITY.md`).

## 3. Backend prerequisites

Items the SafeScan backend must enforce before the app is safe to publish.
The mobile app does best-effort client checks; the server is authoritative.

- [ ] `/auth/verify` verifies the Auth0 ID token signature against the JWKS,
      plus `iss`, `aud`, `exp`, `nonce`. See `SECURITY.md`.
- [ ] `/api/wallet/nonce` issues single-use nonces with a ≤ 5-minute TTL,
      bound to the wallet address.
- [ ] `/api/wallet/verify` looks up the original challenge by nonce and
      validates the Ed25519 signature against the wallet's public key.
- [ ] `/api/user/profile` returns `role: "admin"` only for emails the backend
      considers admins. The client never decides this.
- [ ] HTTPS certificate valid; CDN/Render warm-up doesn't return 5xx during
      the ServerWakeBanner window.

## 4. Build the release APK

```bash
# 1. Bump versions in app.json:
#    "version": "1.0.0"  -> user-facing semver
#    "android.versionCode": 1  -> integer, monotonically increasing

# 2. Build
npx eas build --platform android --profile production --non-interactive
# This produces an .aab AND a side-loadable .apk URL in the EAS dashboard.
# Solana dApp Store needs the .apk variant — download it as:
#   dapp-store/build/safescan.apk
```

The production profile in `eas.json` sets `APP_ENV=production`.

## 5. Media you need to produce

Drop into `dapp-store/media/`:

- [ ] `icon-512.png` — 512×512, opaque (copy from `assets/images/icon.png`)
- [ ] `banner-1920x600.png` — 1920×600, marketing-style hero
- [ ] `screenshots/scanner.png` — 1080×1920
- [ ] `screenshots/result.png`
- [ ] `screenshots/airdrop.png`

(Capture screenshots from a real device or emulator at the listed resolution.)

## 6. Publish to the dApp Store

```bash
npm install -g @solana-mobile/dapp-store-cli

# One-time per publisher:
npx dapp-store create publisher --keypair ./dapp-store/publisher.json

# Once per app:
npx dapp-store create app --keypair ./dapp-store/publisher.json

# Each release:
npx dapp-store create release \
  --keypair ./dapp-store/publisher.json \
  --build-tools-path ~/Library/Android/sdk/build-tools/<latest>

npx dapp-store publish submit \
  --keypair ./dapp-store/publisher.json \
  --requestor-is-authorized \
  --complies-with-solana-dapp-store-policies
```

Approval typically takes a few business days. You'll get a Saga / Seeker
push when the listing goes live.

## 7. Post-launch

- [ ] Wire a crash reporter — call `registerCrashSink(sentryCapture)` in
      `app/_layout.tsx`. The hook is already in place in `services/logger.ts`.
- [ ] Enable EAS Update for OTA JS-only patches (`npx eas update:configure`).
- [ ] Monitor backend cold-start; consider a paid Render tier so users don't
      hit the wake banner.
- [ ] Watch for 1-star reviews mentioning Phantom — the deep-link handshake
      breaks if Phantom isn't installed, and we surface a generic error today.

## 8. Things we deferred

These were on the polish list but felt out of scope for the launch sprint —
revisit after V1 traction.

- Result snapshot share (would need `react-native-view-shot`).
- iOS parity (`ios/` folder exists but isn't wired into EAS or this checklist).
- Push notifications on previously-scanned URLs flipping to danger.
- Detox / Maestro e2e suite.
