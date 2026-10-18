# Project workflow

- After every requested MLT project change, commit all task-related files and push the current branch to `origin`, unless the user explicitly asks not to.

# Public page design contract

- Read STYLE_GUIDE.md before creating or changing public pages. Use the shared spacing and typography tokens from app/globals.css; do not invent section padding or body text sizes.
- Keep the desktop and separate mobile layouts distinct. Ordinary adjacent sections must follow the documented 64 / 48 px content rhythm. Hero/header offsets are explicit exceptions.
- Edit original CSS rules rather than appending competing overrides. Register new base section selectors in tests/design-system.test.mjs. Run the full test suite and inspect desktop/mobile layouts before pushing.
