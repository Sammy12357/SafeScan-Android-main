# dApp Store media assets

Drop the files below into this folder before publishing. All must be **PNG**.
They are referenced by `../config.yaml` under `release.media` — the filenames
and paths must match exactly.

| File                      | Size (px)   | Purpose                                            |
| ------------------------- | ----------- | -------------------------------------------------- |
| `icon-512.png`            | 512 × 512   | App icon — **opaque** (copy from `assets/images/icon.png`) |
| `banner-1920x600.png`     | 1920 × 600  | Marketing hero banner                              |
| `screenshots/scanner.png` | 1080 × 1920 | Scanner / camera screen                            |
| `screenshots/result.png`  | 1080 × 1920 | Risk verdict screen                                |
| `screenshots/airdrop.png` | 1080 × 1920 | Airdrop tier screen                                |

## Notes
- The icon **must be opaque** (no transparency) for the dApp Store.
- Screenshots are **portrait 1080 × 1920** — capture from a real device or emulator.
- Exact filenames matter; `config.yaml` references each by path.
- You can add more screenshots, but also add matching entries in `config.yaml`.
