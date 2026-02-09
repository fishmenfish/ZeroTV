# Building ZeroTV Installer

Quick guide to build Windows installers for ZeroTV.

> **Note**: Currently only Windows builds are configured. macOS and Linux support coming soon.

## What You Need

- Node.js (v18+)
- pnpm (`npm install -g pnpm`)
- Rust ([rustup.rs](https://rustup.rs))
- WiX Toolset v3 (for MSI installer)
  ```cmd
  winget install WiX.Toolset
  ```

## How to Build

1. Install dependencies:
```bash
pnpm install
```

2. Build the installer:
```bash
pnpm installer
```

That's it! The build process will:
- Compile the Angular app
- Build the Rust backend
- Create both MSI and NSIS installers

## Where to Find Your Installers

After building, you'll find two installer types:

- **MSI**: `src-tauri/target/release/bundle/msi/ZeroTV_1.0.0_x64_en-US.msi`
- **NSIS**: `src-tauri/target/release/bundle/nsis/ZeroTV_1.0.0_x64-setup.exe`

Both work the same - pick whichever you prefer to distribute.

## Quick Tips

**First build taking forever?**  
Yeah, Rust needs to compile everything from scratch. Grab a coffee ☕ - it'll be faster next time.

**Need a faster build for testing?**  
```bash
pnpm installer:debug
```

**Something broke?**  
Clean everything and start fresh:
```bash
pnpm clean
pnpm install
pnpm installer
```

**Build specific installer only:**
```bash
pnpm tauri build -- --bundles msi   # MSI only
pnpm tauri build -- --bundles nsis  # NSIS only
```

## Troubleshooting

**"WiX not found" error?**  
Install it: `winget install WiX.Toolset`  
Or download from: https://wixtoolset.org/

**Module not found errors?**  
Delete `node_modules` and `pnpm-lock.yaml`, then run `pnpm install` again.

**Weird path errors?**  
Delete `src-tauri/target` folder and rebuild.

## Notes

- Installer size: ~10-15 MB
- First build: 5-10 minutes
- Subsequent builds: 1-2 minutes
- To update version: edit `package.json` and `src-tauri/tauri.conf.json`
