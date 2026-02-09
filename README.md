# ZeroTV

<div align="center">

![ZeroTV](https://img.shields.io/badge/ZeroTV-v1.0.0-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows-blue?style=flat-square)

**Lightweight IPTV player for Windows**

Built with Angular 21, Tauri 2, and Rust

</div>

---

## What's This?

ZeroTV is a simple IPTV player that doesn't try to do everything. It plays your M3U playlists and stays out of your way. That's it.

## Features

- M3U/M3U8 playlist support
- Search and favorites
- HLS streaming with HLS.js
- EPG program guide
- Auto-reconnect when stream drops
- Keyboard shortcuts
- Actually lightweight (around 10 MB)

## Installation

### Download

Grab the latest release from [here](https://github.com/fishmenfish/zerotv/releases):
- MSI installer (recommended)
- NSIS installer
- Portable exe (no install needed)

### Build It Yourself

Need Node.js 18+, pnpm, and Rust installed.

```bash
git clone https://github.com/fishmenfish/zerotv.git
cd zerotv
pnpm install
pnpm installer
```

Check [BUILD.md](BUILD.md) for more details.

## How to Use

1. Open ZeroTV
2. Load your M3U playlist (file or URL)
3. Click a channel
4. Watch

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` `↓` | Previous/Next channel |
| `Space` | Play/Pause |
| `M` | Mute |
| `+` `-` | Volume |
| `F` | Fullscreen |
| `1-9` | Quick jump |

## Tech Stack

- Angular 21
- Tauri 2
- Rust
- HLS.js

## Support

Feel free to support this project if you find it useful:

- [PayPal](https://paypal.me/muhammadfaiz0817)

## License

MIT License - see [LICENSE](LICENSE)

## Author

**fishmenfish**

- GitHub: [@fishmenfish](https://github.com/fishmenfish)

---

<div align="center">

Made by fishmenfish

</div>
