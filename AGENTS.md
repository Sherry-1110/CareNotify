# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

CareNotify is a React + TypeScript (Vite) SPA for empathetic STI partner notification. See `README.md` for full stack details and setup steps.

### Running the app

- **Dev server:** `npm run dev` (Vite, port 5173)
- **Build:** `npm run build` (runs `tsc -b && vite build`)
- **TypeScript check:** `npx tsc -b`

### Lint

`npm run lint` requires an `eslint.config.js` (ESLint 9 flat config) which is **missing from the repo**. The ESLint devDependencies are installed but there is no config file, so lint currently fails with "ESLint couldn't find an eslint.config.(js|mjs|cjs) file." This is a known repo issue, not an environment problem.

### Environment variables

The app works fully in guest mode without any environment variables. For AI-generated messages, set `VITE_OPENAI_API_KEY` in a `.env` file (client-side direct calls in dev). Without it, a hardcoded fallback message is used. Firebase config (`VITE_FIREBASE_*`) is optional.

### Functions sub-package

`/functions/` contains Firebase Cloud Functions (alternative backend). It requires Node 20 per its `engines` field but installs and works on Node 22 with a warning. This sub-package is **not required** for local dev — the Vite dev server serves the frontend independently.

### Testing

No automated test framework (jest, vitest, etc.) is configured in this repository. Manual testing is done by running the dev server and stepping through the wizard flow in a browser.
