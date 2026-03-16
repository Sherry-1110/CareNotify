<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![Vite][vite-shield]][vite-url]
[![React][react-shield]][react-url]
[![Firebase][firebase-shield]][firebase-url]

<br />
<div align="center">
  <a href="#readme-top">
    <img src="public/logo.jpg" alt="CareNotify Logo" width="100" height="100">
  </a>

  <h3 align="center">CareNotify</h3>

  <p align="center">
    AI-assisted sexual health disclosure support app
    <br />
    <a href="#getting-started"><strong>Get Started »</strong></a>
    <br />
    <br />
    <a href="#known-bugs">Known Bugs</a>
    ·
    <a href="#firebase-setup">Firebase Setup</a>
    ·
    <a href="#third-party-services">Third-Party Services</a>
  </p>
</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#built-with">Built With</a></li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#firebase-setup">Firebase Setup</a></li>
    <li><a href="#seedreference-data">Seed/Reference Data</a></li>
    <li><a href="#third-party-services">Third-Party Services</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#known-bugs">Known Bugs</a></li>
  </ol>
</details>

## About The Project

CareNotify is a React + Firebase web app that helps users notify partners after an STI diagnosis using either:
- AI-generated text message options, or
- A phone-call coaching flow with likely/challenging/best-case response scenarios.

The app flow includes:
1. Authentication / guest mode
2. Partner and diagnosis context capture
3. AI generation for message/coaching output
4. Copy/share-ready final output

### Screenshot

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Built With

- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS (v3)](https://tailwindcss.com/)
- [Firebase (Auth + Firestore)](https://firebase.google.com/)
- OpenAI Responses API

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started

### Prerequisites

- Node.js 18+ (recommended LTS)
- npm 9+
- Firebase project (for auth/progress logging)
- OpenAI API key (for AI generation)

### Installation

1. Clone the repository.
   ```sh
   git clone <your-repo-url>
   cd CareNotify
   ```

2. Install dependencies.
   ```sh
   npm install
   ```

3. Create `.env` in the repo root with:
   ```bash
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=

   # Frontend OpenAI path (used in local dev)
   VITE_OPENAI_API_KEY=
   # Optional model override
   VITE_OPENAI_MODEL=gpt-4.1-mini
   ```

4. Start development server.
   ```sh
   npm run dev
   ```

5. Build for production.
   ```sh
   npm run build
   ```

### Does data need to be created first?

No required seed data is currently needed for the app to boot and run. The app primarily uses user-provided flow data in-session plus Firebase Auth/Firestore for progress logging.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Firebase Setup

1. Create a Firebase project:
   - https://console.firebase.google.com/

2. Add a Web App in Firebase Project Settings.

3. Copy web config values into `.env` (`VITE_FIREBASE_*`).

4. Enable Authentication providers used by this app:
   - Anonymous
   - Email/Password
   - Google

5. Create Firestore database.

6. Configure security rules according to your environment policy.

7. (Optional deploy path) Firebase Hosting/Functions:
   - `firebase.json` currently rewrites `/api/generate-message` to a Firebase Function.
   - If using Firebase deploys, configure and deploy via:
     ```sh
     npm run deploy
     ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Seed/Reference Data

This repo currently has no mandatory static seed collection required for app startup.

If your team adds app-level config/reference collections later (e.g., templates, lookup tables):
- Export/import only those whitelisted reference collections.
- Do not export user data (`users`, `progress`, logs, messages, PII).
- Store approved seed JSON under a versioned folder such as:
  - `seed/firebase/<collection>.json`

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Third-Party Services

### OpenAI

Used for:
- message generation
- guidance/tips
- call coaching insights

Config options:
- Frontend key: `VITE_OPENAI_API_KEY`
- Optional model override: `VITE_OPENAI_MODEL`

Security guidance:
- Never commit secret keys.
- Prefer server-side API routes for production key handling.

### Firebase

Used for:
- auth/session identity
- progress logging in Firestore

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage

- User signs in (or continues as guest)
- User enters partner/diagnosis context
- User chooses text or call disclosure path
- App generates selectable AI outputs
- User copies/sends result

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contributors
- Vicheda Narith
- Ellis Aguilar
- Shan Wang
- Viraj Agarwala
- Kevin Rha

## Known Bugs

1. `npm run lint` may fail because ESLint v9 expects a flat config (`eslint.config.js`) and this repo currently does not include one.
2. If Tailwind/PostCSS versions drift (e.g., Tailwind v4 with v3 config), dev/build can fail with PostCSS plugin errors.
3. Bundle size warning during `npm run build` (large JS chunk) is present and should be addressed with code-splitting.
4. Firebase writes for profile/progress may fail silently when Firestore is missing or rules deny writes (auth still succeeds).

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
[vite-shield]: https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white
[vite-url]: https://vitejs.dev/
[react-shield]: https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[react-url]: https://react.dev/
[firebase-shield]: https://img.shields.io/badge/Firebase-11.x-ffca28?style=for-the-badge&logo=firebase&logoColor=black
[firebase-url]: https://firebase.google.com/
[product-screenshot]: public/logo.jpg
