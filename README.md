# ZeroTV

<div align="center">

![ZeroTV](https://img.shields.io/badge/ZeroTV-v1.0.0-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows-blue?style=flat-square)

**Lightweight IPTV player for Windows**

Built with Angular 21, Tauri 2, and Rust

</div>

---

## Features

- 📺 M3U/M3U8 playlist support
- 🔍 Search & favorites
- 🎬 HTML5 video player with HLS.js
- 📅 EPG program guide
- 🔄 Auto-reconnect
- ⌨️ Keyboard shortcuts
- 💾 Lightweight (~10 MB)

## Installation

### Download

Download the latest Windows installer:
- [ZeroTV-1.0.0-setup.exe](https://github.com/fishmenfish/zerotv/releases)

### Build from Source

**Requirements:**
- Node.js 18+
- pnpm 8+
- Rust 1.70+

```bash
git clone https://github.com/fishmenfish/zerotv.git
cd zerotv
pnpm install
pnpm tauri:build
```

## Usage

1. Open ZeroTV
2. Click "Load File" or "Load from URL"
3. Select your M3U playlist
4. Click a channel to play

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

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT License - see [LICENSE](LICENSE)

## Author

**fishmenfish**

- GitHub: [@fishmenfish](https://github.com/fishmenfish)
- Support: [PayPal](https://paypal.me/muhammadfaiz0817)

---

<div align="center">

Made with ❤️ by fishmenfish

</div>
