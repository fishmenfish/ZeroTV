# Contributing to ZeroTV

Thanks for your interest in contributing!

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Rust 1.70+
- Windows 10/11

### Setup

```bash
git clone https://github.com/fishmenfish/zerotv.git
cd zerotv
pnpm install
pnpm tauri:dev
```

## How to Contribute

### Reporting Bugs

- Check existing issues first
- Use the bug report template
- Include OS version and steps to reproduce

### Suggesting Features

- Check existing feature requests
- Explain the use case clearly
- Describe expected behavior

### Pull Requests

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m "feat: add feature"`
6. Push: `git push origin feature/your-feature`
7. Open a Pull Request

## Code Style

### TypeScript
- Use TypeScript strict mode
- Follow Angular style guide
- Use signals for state

### Rust
- Run `cargo fmt`
- Handle errors properly
- Add comments for complex logic

### CSS
- Use CSS variables
- Keep selectors simple
- Follow existing patterns

## Commit Messages

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style
- `refactor:` Code refactoring
- `perf:` Performance
- `test:` Tests
- `chore:` Maintenance

## Testing

Before submitting:
- Test on Windows
- Check for console errors
- Verify with different playlists

## Questions?

Open a [GitHub Discussion](https://github.com/fishmenfish/zerotv/discussions)

---

Thank you for contributing! 🎉
