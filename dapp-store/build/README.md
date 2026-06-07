# Build output

Place the production APK here, named exactly:

    safescan.apk

It is referenced by `../config.yaml` under `release.files` (`purpose: install`).

## How to produce it

```bash
eas build --platform android --profile production
```

On the first run, answer **Yes** when EAS offers to generate the Android
keystore, then back it up:

```bash
eas credentials   # Android -> production -> Keystore: Download
```

When the build finishes, download the **.apk** artifact from the EAS dashboard
and save it here as `safescan.apk`.

> The APK itself is git-ignored (see `.gitignore`) — it's a large build
> artifact and should not be committed.
