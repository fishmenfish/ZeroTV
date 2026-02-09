# Changelog

All notable changes to ZeroTV.

## [1.1.0] - 2026-02-09

### Fixed
- **Critical**: Fixed memory leak in video player component (setTimeout not cleaned up)
- **Critical**: Fixed race condition in logo cache service when multiple components request same logo
- **Critical**: Fixed EPG service memory leak (interval not properly cleaned up)
- Fixed weak hash function in M3U parser (hash & hash → hash | 0)
- Fixed duplicate hotkey registrations (M/m, F/f now handled by case-insensitive matching)
- Fixed Windows compatibility issue in clean script (rm -rf → rimraf)

### Improved
- Replaced manual search debounce with RxJS operators (debounceTime + distinctUntilChanged)
- Extracted magic numbers to named constants for better maintainability
- Added proper cleanup in ngOnDestroy for all components and services
- Improved logo cache with promise deduplication to prevent redundant requests
- EPG service now uses RxJS interval instead of setInterval for better lifecycle management

### Changed
- Removed duplicate "start" script, kept "dev" as primary development command
- Bumped version to 1.1.0
- Added rimraf as devDependency for cross-platform file cleanup

### Performance
- Optimized search input handling with RxJS
- Better memory management across all services
- Reduced redundant logo fetch requests

## [1.0.0] - 2026-02-09

### Added
- M3U/M3U8 playlist support
- HTML5 video player with HLS.js
- EPG program guide
- Auto-reconnect
- Stream health monitoring
- Custom headers
- Favorites & search
- Keyboard shortcuts
- Settings export/import

### Performance
- Fast Rust M3U parser
- Optimized RAM usage
- Small app size (~10 MB)

### Platform
- Windows 10/11 support

---

Created by [fishmenfish](https://github.com/fishmenfish)
