# API Key Exposure & Remediation

## What happened

1. **Build-time inlining**  
   The project uses Vite, and Firebase config is read via `import.meta.env.VITE_FIREBASE_*`.  
   During **build**, Vite **inlines** all env vars starting with `VITE_` into the output JS (e.g. `dist/assets/index-xxx.js`), so the **API key ends up inside the built assets**.

2. **Built output was committed**  
   **`dist/`** was not in `.gitignore`, so after someone ran `npm run build`, the `dist/` folder was committed and pushed to GitHub.  
   That made the real API key in `dist/assets/index-xxx.js` publicly visible.

3. **Exposed URL**  
   Google reported a URL like:  
   `https://github.com/Sherry-1110/CareNotify/blob/.../dist/assets/index-DoCXfCdU.js`  
   That file contains Firebase `apiKey` and related config.

## Where the key is used in code

- **Config source**: `src/lib/firebase.ts` reads from env:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - etc.
- **Env file**: Local `.env` (in `.gitignore`, must not be committed).  
- **Build**: When you run `npm run build`, those vars are inlined into JS under `dist/`.

## Code-side fix (already done)

- **`.gitignore`** was updated to include:
  - `dist` — so build output is not committed again
  - `.env.local` and `.env.*.local` — so local env files with secrets are not committed by mistake

So even if someone runs `npm run build`, `dist/` will not be added to the repo.

## What you must do (GCP / key side)

1. **Restrict or revoke the API key in Google Cloud Console**
   - Open [Google Cloud Console](https://console.cloud.google.com/) → select project **carenotify-app**.
   - Go to **APIs & Services → Credentials** and find the key: `AIzaSyDBXGsEu-HoskucsUcjPy9uhjbxDYzK6gU`.
   - **Option A (recommended)**: Delete this key, create a new one in Firebase project settings for the frontend, and set **Application restrictions** (e.g. HTTP referrer to your domain only).
   - **Option B**: Keep the key but add **Application restrictions** (e.g. allow only your domain) and **API restrictions** (only the APIs you need, e.g. Identity Toolkit) to limit abuse.  
   Note: Because the key has already appeared in a public repo, **the safest approach is to revoke/delete it and use a new key**.

2. **Remove the key from Git history (optional but recommended)**
   - Even if you stop committing `dist/`, past commits still contain the exposed key.
   - Use `git filter-repo` or BFG Repo-Cleaner to remove `dist/` or that file from history.  
   - This rewrites history and requires a force push; coordinate with collaborators before doing it.

3. **Do not rely on committed dist for deployment**
   - Deploy by running `npm run build` in CI/CD (e.g. GitHub Actions), injecting `VITE_FIREBASE_*` and other env vars in CI (e.g. GitHub Secrets). **Do not** serve production from a pre-built `dist/` checked into the repo.

## Summary

| Item | Description |
|------|-------------|
| **Where it leaked** | Built file `dist/assets/index-xxx.js` was committed to GitHub; it contains the inlined `VITE_FIREBASE_API_KEY`. |
| **Root cause** | 1) Vite inlines `VITE_*` into frontend JS; 2) `dist/` was not ignored and was committed. |
| **Code-side** | `dist` and `.env.local` (etc.) are now in `.gitignore` to prevent committing them again. |
| **Your action** | Restrict/revoke and preferably replace the API key in GCP; consider removing key-containing `dist/` or files from Git history. |
