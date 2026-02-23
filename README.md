# CareNotify

An empathetic web app for STI notification. Notify with care.

## Stack

- **React** + **TypeScript** (Vite)
- **Tailwind CSS** – calming/medical-modern UI
- **Firebase** – Auth (incl. anonymous for guests), optional progress logging
- **Firebase Functions** – secure LLM message generation endpoint
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

3. **LLM message generation (recommended)**

   The final step can generate a personalized disclosure message using a Firebase Function (`/api/generate-message`).

   Install function dependencies:

   ```bash
   cd functions
   npm install
   cd ..
   ```

   Set OpenAI secret for Firebase Functions:

   ```bash
   firebase functions:secrets:set OPENAI_API_KEY
   ```

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173).

## User flow (4 steps)

1. **Auth** – Sign up/Login (Firebase) or Continue as Guest.
2. **Message editor** – Partner + relationship details, STI type, relationship context uploads, attachment style.
3. **Kit sponsorship** – Optional “Sponsor a testing kit” (Pre-paid/Included).
4. **Completion** – LLM-generated personalized message, copy/share actions, privacy note for guests.

## Build

```bash
npm run build
```

Output in `dist/`.

## Deploy to Vercel

1. Push the repo to GitHub (if not already).
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the **CareNotify** repo.
3. Leave **Build Command** as `npm run build`, **Output Directory** as `dist` (Vercel uses `vercel.json`).
4. In **Environment Variables**, add:
   - **Name:** `OPENAI_API_KEY`  
   - **Value:** your OpenAI API key  
   (Add for Production, Preview, Development if you want.)
5. Click **Deploy**. The site and `/api/generate-message`, `/api/generate-guidance` will be served from the same domain; the frontend will call them with relative URLs, so no extra config is needed.
