# CareNotify

An empathetic web app for STI notification. Notify with care.

## Stack

- **React** + **TypeScript** (Vite)
- **Tailwind CSS** – calming/medical-modern UI
- **Firebase** – Auth (incl. anonymous for guests), optional progress logging
- **Framer Motion** – step transitions
- **Lucide React** – icons

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Firebase (optional)**

   - Create a [Firebase](https://console.firebase.google.com) project.
   - Enable **Authentication** → **Anonymous** sign-in.
   - Optionally create a **Firestore** database for progress logging.
   - Copy `.env.example` to `.env` and fill in your config.

   The app works without Firebase: guest flow and all 4 steps still run; only anonymous logging is skipped.

3. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173).

## User flow (4 steps)

1. **Auth** – Sign up/Login (Firebase) or Continue as Guest.
2. **Message editor** – Partner name, test result, tone (Supportive / Direct), live preview, editable script.
3. **Kit sponsorship** – Optional “Sponsor a testing kit” (Pre-paid/Included).
4. **Completion** – Copy to clipboard, Share via Text/WhatsApp; privacy note for guests.

## Build

```bash
npm run build
```

Output in `dist/`.
