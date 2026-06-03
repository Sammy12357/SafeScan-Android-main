# Security Notes (Mobile)

This file tracks what the **mobile client** does, and what the **backend**
(FastAPI app, see backend repo `SECURITY.md`) must enforce. The backend is
the source of truth; client checks are belt-and-suspenders only.

Last reconciled against backend `SECURITY.md` on 2026-06-02.

---

## ✅ Already delivered server-side

The backend has independently shipped most of what this client assumes. From
the backend's own SECURITY.md:

| Concern | Status |
|---|---|
| Admin role server-side (`user`/`admin`/`owner` enum) | ✅ Delivered |
| Server-side admin allowlist via Render `ADMIN_EMAILS` env | ✅ Delivered |
| Session storage in `sessions` table | ✅ Delivered |
| Suspended/deleted users rejected on session load | ✅ Delivered |
| URL validation + private/internal host blocklist before any fetch | ✅ Delivered |
| Redirect tracing validates every hop before requesting | ✅ Delivered |
| Wallet nonce: 5-minute TTL, single-use, rate-limited (5/hr/wallet) | ✅ Delivered |
| Wallet signature: Ed25519 verified server-side | ✅ Delivered |
| Wallets stored server-side; scan submission never trusts client wallet | ✅ Delivered |
| Scan count increments are server-side only, deduped per user+payload | ✅ Delivered |
| Audit log on login/logout/scan/wallet/account-delete | ✅ Delivered |
| Rate limits on `/api/*` and `/api/analyze` | ✅ Delivered |
| Security headers (HSTS, CSP, Referrer-Policy, X-Content-Type-Options) | ✅ Delivered |
| Data export/erasure binds to active session email | ✅ Delivered |

This means the mobile client can rely on the backend for everything in the
"Backend must" sections of the old version of this file.

---

## ⚠️ Outstanding alignment — Auth0 ID token verification

The mobile app signs in via **Auth0** (tenant `safe-scan-qr.us.auth0.com`),
receives an ID token signed by Auth0, and POSTs it to `/auth/verify`.

The backend's `SECURITY.md` (Render env vars list) currently shows:
- `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET`
- `JWT_SECRET`

…but no `AUTH0_DOMAIN` / `AUTH0_CLIENT_ID`. That suggests `/auth/verify`
was originally built to verify **Google-issued** ID tokens directly, not
Auth0-issued ones.

### What the backend must add for the mobile sign-in to complete

`/auth/verify` needs to accept either token issuer:

1. **Read these env vars on Render:**
   ```
   AUTH0_DOMAIN=safe-scan-qr.us.auth0.com
   AUTH0_CLIENT_ID=MPettOuBPUwtgifGOlt6NpJR4rl8BuL7
   ```

2. **Detect issuer** by decoding the token's `iss` claim:
   - `https://accounts.google.com` → existing Google verification path.
   - `https://safe-scan-qr.us.auth0.com/` → new Auth0 verification path.

3. **For Auth0 tokens**, verify against the JWKS at
   `https://safe-scan-qr.us.auth0.com/.well-known/jwks.json`:
   - Signature verifies against the matching JWK.
   - `iss == "https://safe-scan-qr.us.auth0.com/"`.
   - `aud` contains `MPettOuBPUwtgifGOlt6NpJR4rl8BuL7`.
   - `exp` in the future.

4. **Mint a session** as it does today (cookie OR Bearer — see next section).

### Mobile vs. web session model

The backend currently uses HTTP-only Secure cookies (`sessions` table). The
mobile app does not use cookies — it stores `accessToken` / `refreshToken`
in SecureStore and sets `Authorization: Bearer <token>` on every request.

Backend must support both transports:
- **Web** (existing): `Set-Cookie: session=…` on `/auth/verify` response.
- **Mobile** (must add if not present): `/auth/verify` response body includes
  `{ accessToken, refreshToken, user }`. The mobile API client at
  `services/apiClient.ts` already expects this shape.

If the backend doesn't already return a Bearer token, mobile sign-in falls
through to the local-only fallback ("Signed in locally — backend session
unavailable…") and protected endpoints stay 401. The app stays usable
because of the offline-first fallbacks added in this repo, but airdrop /
profile / wallet endpoints won't work until the backend lands this.

---

## Mobile-side controls in this repo

### OAuth handshake (`hooks/useGoogleAuth.ts`)

1. 32-byte random `nonce` and `state` per sign-in attempt
   (`expo-crypto.getRandomBytes`).
2. On callback: verify returned `state` matches sent.
3. Decode ID token, verify `nonce` matches sent, `aud == client_id`,
   `iss` contains Auth0 domain, `exp` in future.
4. POST raw ID token to `/auth/verify`.

These checks are belt-and-suspenders. The backend's JWKS signature
verification (above) is the real defense against forged tokens.

### Wallet (Phantom)

Mobile uses Phantom's deep-link protocol with NaCl box (X25519 +
XSalsa20-Poly1305). Fresh keypair per connect, stored in SecureStore.
Shared secret derived after Phantom returns `phantom_encryption_public_key`.

Concurrent `connect()` calls are now rejected with a clear error
(`hooks/useWallet.ts:282`). `processedCallbackUrls` is bounded to 32 entries
with FIFO eviction.

The backend already implements single-use nonces and Ed25519 signature
verification — this client trusts those guarantees.

### Authorization

`roleForEmail(email, backendRole)` in `constants/config.ts` returns `"admin"`
**only** if the backend's user profile response already says so. The client
never decides.

The legacy `EXPO_PUBLIC_ADMIN_EMAILS` was removed. Anything prefixed
`EXPO_PUBLIC_*` ships in the JS bundle and helps phishers target admins.

### Token storage

- Access + refresh tokens live in `expo-secure-store`.
- Rehydrated on every cold start by `authStore.hydrateFromStorage`.
- Silent refreshes inside `services/apiClient.ts#request()` write the new
  tokens back to SecureStore via `setTokenPersister`, so a stale access
  token never survives across launches.

### Deep links

Only two routes are exposed by `app/_layout.tsx#pathFromDeepLink`:
- `safescan://airdrop` → `/(tabs)/airdrop`
- `safescan://scan-result/<id>` → `/scan-result/{encodeURIComponent(id)}`

The `id` is URL-encoded and used only as a cache-lookup key — arbitrary
payloads can't reach `fetch()` calls or trigger code execution.

### Crash + error reporting

`services/logger.ts` exposes `log.error` which always invokes a registered
`CrashSink`. No SDK is wired by default; call
`registerCrashSink(Sentry.captureException)` (or equivalent) once in
`app/_layout.tsx` to start capturing.

---

## Known limitations

- **Auth0 implicit flow is legacy.** Switching to Auth Code + PKCE requires
  a backend code-exchange endpoint that doesn't exist yet. Implicit flow is
  acceptable for native apps but PKCE is the modern recommendation.
- **Push notification topic subscriptions** (if added later) must never be
  decided client-side — backend must authorize subscription requests so an
  attacker can't subscribe to admin-only channels.
- **iOS** is unwired (`ios/` folder exists but no EAS profile, no Apple
  Developer account, no App Store metadata). Currently Android-only.
