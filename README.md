# Health Copilot

> **Your Health, Organised. Your Questions, Answered.**
> A real-world-style, AI-assisted health management web app for patients **and** doctors.

Health Copilot is a React + TypeScript web app that gives every user a personal health
space — medical records, prescriptions, appointments, trends, wellness goals and an AI
assistant you can **type, speak, or show a photo to** — and gives doctors a separate
**practice portal** with their patient roster and visit calendar.

- Sign-in uses **real Firebase accounts**. Anyone can **create a free account** — patient or
  doctor — on the sign-up page (see [Accounts and roles](#accounts-and-roles)).
- Each account is **locked to one role** — a patient account can never sign in as a doctor,
  and a doctor account can never sign in as a patient.
- Two **built-in sample accounts** ship with seeded data so you can explore instantly;
  every other account starts fresh and keeps its own data.

> ⚠️ **Not a medical product.** All people, records, readings and appointments are
> **fictional sample data**. Nothing here diagnoses, treats, prescribes or gives medical
> advice. See [Limitations & safety](#limitations--safety).

---

## Two sample accounts (built-in personae)

Exactly two accounts are pre-seeded with data — one patient, one doctor:

| Role    | Email                      | Password     | Seeded data                                        |
| ------- | -------------------------- | ------------ | -------------------------------------------------- |
| Patient | `patient@healthcopilot.app` | `Health@2026` | Alex Morgan's records, medicines, appointments, goals |
| Doctor  | `doctor@healthcopilot.app`  | `Health@2026` | Dr. Priya Raman's practice: patients, records, calendar |

Every other account starts with an **empty, private space** — data is scoped per
user, so accounts never share records on the same device.

## Accounts and roles

Every account is locked to one role: patient credentials can never open the doctor side, and
doctor credentials can never open the patient side.

**Patients and doctors — self-service**

- Anyone can create a patient **or** doctor account from the login page (**Create a new
  account**) by choosing the matching role — the chosen role is bound to that account.
- A new doctor account opens the **practice portal** with an empty, private practice: no seeded
  patients, no appointment requests. New patient accounts likewise start fresh and build their
  own records.

**Accounts — created by the team (optional)**

1. In **Firebase console → Authentication → Users → Add user**, create the account with the
   person's email and a password you share with them.
2. They sign in and choose **“I am a patient”** or **“I am a doctor”** — the role is bound to
   that account.
3. (Recommended) Also create a Firestore document `users/{uid}` with `{ "role": "patient" }`
   (or `"doctor"`) so the role follows the account on any device.

**Sample directory clinicians**

- Every clinician in the appointment-request directory (`src/data/doctorsData.ts`) also has a
  ready-made sign-in with the shared password `Health@2026` — for example Dr. Mei Chen at
  `mei.chen@northbridge.example`. Each directory sign-in opens the practice portal and reviews
  the **shared practice inbox** — every patient application, clearly marked with the doctor it
  targets, so a request always shows up no matter which doctor the patient picked. These are
  sample accounts only.

Because roles are bound, a patient account can never open the practice portal, and a doctor
account can never sign in as a patient.

## Quick start

```bash
# from the project root
npm install

# start the dev server (no Firebase config needed — local mode)
npm run dev
```

Then open **http://localhost:5173** and sign in with one of the sample accounts above, or
create a patient or doctor account from the sign-up page
(see [Accounts and roles](#accounts-and-roles)).

## Optional: connect the real backend (Firebase)

Authentication uses Firebase Identity Toolkit + Firestore over their public REST APIs —
no Firebase SDK is bundled. The Firebase web API key is public by design (it only
identifies the project); it goes in an env file that is **never committed**.

1. Create a Firebase project at <https://console.firebase.google.com/>.
2. Enable **Authentication → Sign-in method → Email/Password** (required for Email/Password
   accounts).
3. (Optional but recommended) create a **Firestore database** and deploy the rules in
   [`firestore.rules`](./firestore.rules) (`firebase deploy --only firestore:rules`).
   They let each signed-in account read and write only its own `users/{uid}` document,
   so roles sync across devices. Without Firestore the app still works: roles fall back
   to a per-device cache.
4. Create a web app in the console and copy its `apiKey` and `projectId`.
5. Create a `.env` file (see `.env.example`):

   ```env
   VITE_FIREBASE_API_KEY=your-web-api-key
   VITE_FIREBASE_PROJECT_ID=your-project-id
   ```

6. Restart the dev server or rebuild. Without `.env`, the app degrades to **local
   browser accounts** so development and testing still work offline.

Roles (patient/doctor) are stored in a Firestore `users/{uid}` document and resolved on
sign-in with a local cache + the role you chose on the login screen as fallback.

## Available scripts

| Command             | What it does                                          |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Start the Vite dev server on port `5173`.             |
| `npm run build`     | Type-check (`tsc --noEmit`) then build for production.|
| `npm run preview`   | Serve the production build locally (port `4173`).     |
| `npm run typecheck` | Run TypeScript with no emit.                          |
| `npm test`          | Run the assistant unit tests (Node's built-in runner).|
| `npm run lint`      | Run ESLint.                                           |
| `npm run deploy`    | Build and deploy to Firebase Hosting (needs the CLI). |

> **Low-memory machines:** if `npm run build` fails in the minifier, run the steps
> separately — `npm run typecheck`, then
> `NODE_OPTIONS=--max-old-space-size=128 RAYON_NUM_THREADS=2 npx vite build`
> (on Windows use `set NODE_OPTIONS=... && set RAYON_NUM_THREADS=2 && npx vite build`).

## Deploy to Firebase Hosting

The app is a static SPA; `firebase.json` serves `dist/` and rewrites all routes to
`index.html` for the client-side router.

1. **Install the CLI and sign in** (once):

   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Select your project** from the project root (writes `.firebaserc`):

   ```bash
   firebase use --add
   ```

3. **Build with the backend env present** (so the live site uses real accounts):

   ```env
   # .env  — VITE_FIREBASE_API_KEY + VITE_FIREBASE_PROJECT_ID
   ```

4. **Deploy:**

   ```bash
   npm run deploy
   ```

   Your site is live at `https://<your-project-id>.web.app`.

## Tech stack

- **React 19** + **TypeScript** (strict) + **Vite** (Rolldown)
- **Tailwind CSS v4** (theme tokens in `src/index.css`)
- **React Router v7** · **Lucide React** icons · **Recharts** charts
- **React Hook Form** + **Zod** validation
- **Firebase Auth + Firestore REST clients** (no SDK) with localStorage fallback
- **Web Speech API** (voice input) + **getUserMedia** (camera) for the assistant

## Pages

**Patients**

| Route            | Page                 | Highlights                                                       |
| ---------------- | -------------------- | ---------------------------------------------------------------- |
| `/`              | Dashboard            | Greeting, metric cards, trends, today's meds, appointments.       |
| `/assistant`     | AI Health Assistant  | Type, voice or photo input, suggested questions, disclaimers.     |
| `/records`       | Medical Records      | Search, filters, details, metadata-only uploads shared with your care team. |
| `/prescriptions` | Prescriptions        | Doctor-prescribed medicines (read-only), daily “taken” toggle.    |
| `/appointments`  | Appointments         | Upcoming/past views, add/edit/cancel, apply to doctors.             |
| `/analytics`     | Health Analytics     | Period selector, multi-metric charts.                             |
| `/wellness`      | Wellness & Goals     | Goal progress, habit tracker.                                     |

**Doctors** (separate portal)

| Route                       | Page                        | Highlights                              |
| --------------------------- | --------------------------- | --------------------------------------- |
| `/doctor`                   | Practice Overview           | Stats, today's schedule, recent records.|
| `/doctor/requests`          | Appointment requests        | Clickable pending/accepted/cancelled filters, accept or cancel.|
| `/doctor/reports`           | Patient reports             | Reports patients shared; mark as seen to notify them. |
| `/doctor/prescriptions`     | Prescriptions               | Pick a patient from a dropdown and write a prescription. |
| `/doctor/patients`          | Patients                    | Roster with conditions and last visits. |
| `/doctor/patients/:id`      | Patient detail              | Records, medicines, allergies, visits, shared reports, prescribe. |
| `/doctor/appointments`      | Appointments                | Today, upcoming and past visits.        |

**Shared**: `/profile`, `/settings`, `/help`.

## AI Health Assistant (built-in Copilot)

The assistant is a **deterministic, source-linked education engine** that runs entirely in
the browser — no API key required, nothing leaves the device. It now includes:

- **Symptom Checker** — describe a problem in plain language and get a structured reply:
  a summary, possible explanations (most common first), the follow-up questions that would
  clarify it, warning signs, what helps now, tests a clinician may order, medicines commonly
  discussed (with a clear "do not start/stop without your clinician" note), a realistic
  outlook and its uncertainties, and general source links.
- **Medication Explainer** — a built-in reference for common medicines (paracetamol,
  ibuprofen, amoxicillin, metformin, omeprazole, amlodipine, atorvastatin and more) covering
  generic/brand names, common uses, how it works, side effects, warning signs, precautions,
  interactions and questions to ask. **Unknown medicines are never guessed** — the reply says
  what is missing instead of inventing details.
- **Report reader** — type values from a report (e.g. `HbA1c 7.2%`, `LDL 160 mg/dL`) and each
  term is explained in plain language with what higher/lower generally means.
- **Deterministic emergency escalation** — emergency phrases are detected before any answer
  and direct users to **112** (India) or the local emergency number. This never depends on a
  model's judgement.
- **Source links** — every relevant answer links to reputable, general sources (MedlinePlus,
  WHO, NHS, FDA/DailyMed). Citations are links, never invented studies.

### Optional: connect a real AI model

The built-in assistant is honest about what it is (a fixed library, not a live model). To use
a real model you must run a **small server endpoint** that holds your provider key — keys must
never ship in the browser bundle. Set `VITE_AI_PROVIDER=remote`, `VITE_AI_ENDPOINT` and
`VITE_AI_MODEL` in `.env`; the endpoint receives `{ model, messages }` and returns `{ reply }`.
If the endpoint is missing or unreachable, the app falls back to the built-in assistant and
**labels the reply as such** — it never presents a simulated answer as real AI output. The
assistant page shows these setup steps inline while no model is connected.

## Project structure

```
src/
  components/
    auth/        AuthShell (sign-in layout + product explainer)
    common/      Button, Card, Badge, Modal, Toggle, form controls, …
    layout/      AppLayout, Header, Sidebar, MobileNavigation,
                 GlobalSearch, NotificationsPanel, UserMenu, PageContainer
    assistant/   ChatWindow, ChatComposer (voice + camera), ChatMessage, …
    dashboard/ records/ prescriptions/ appointments/
    wellness/    feature components
  context/       Auth, Preferences (theme), Data, Toast providers
  data/          Deterministic FICTIONAL sample data + practice roster
  hooks/         useLocalStorage, useTheme, useDismissable, usePracticePatients
  pages/         One component per route (+ pages/doctor for the portal)
  services/      storage, auth, firebase REST client, ai, health, records, …
  types/         Domain models (health, user, practice)
  utils/         cn, formatters, Zod schemas, speech, image capture
  index.css      Design system / theme tokens
tests/           Node-native unit tests for the assistant (npm test)
```

## Appointment requests

Patients can **apply for an appointment** from the Appointments page by choosing **one or
more doctors** from a fictional directory (`src/data/doctorsData.ts`). A separate request is
created for every selected doctor and stored in a **shared** collection
(`health-copilot:appointment-requests`) so the patient and doctor sides on the same device
see the same requests:

- **Patient** — `Appointments → Requests` shows the status of every application
  (pending / accepted / cancelled). Submitting an application raises an in-app notification.
- **Doctor** — `Requests` in the practice portal shows count cards for **pending, accepted
  and cancelled** requests. The cards are clickable filters: pick a status to see exactly
  who is in that group. Each pending request has **Accept** and **Cancel** actions.
- The doctor view is the **practice inbox**: a signed-in directory clinician sees every
  application in the shared pool (each card marks which doctor it targets), so a request a
  patient sends always shows up for the doctor — no matter which directory doctor it was
  aimed at. Self-registered doctors are not in the directory, so they start with no inbox.
- **Accept** adds the visit to the patient's calendar as a *scheduled* appointment, mirrors it
  onto the selected doctor's calendar (Today / Upcoming visits, and
  `Doctor portal → Appointments`), and sends the patient an in-app notification.
  **Cancel** declines the request and notifies the patient.
- These are **in-app demo notifications only** — no email, SMS or push is sent, and delivery
  is limited to the browser/device where the request was made.

## Adding your own appointments

When a patient adds or edits an appointment on the Appointments page, the form asks them to
pick a **doctor from the practice directory** (only doctor names are offered). Selecting a
doctor fills in the provider, specialty and location automatically — there is no free-text
clinic/doctor field.

## Feedback board

`Help & Support` (reachable from both the patient and the doctor side) has a **Send feedback**
form and a **shared board**.

- **Patients and doctors can both post.** A submission is stored with the author's name and
  role, a 1–5 star rating and the message.
- **Everyone sees the same board.** Feedback is a single shared collection
  (`health-copilot:feedback`, like appointment requests) so every patient and doctor on this
  device reads all entries — a doctor sees what patients wrote, and vice versa.
- **No limit.** The form stays open after each submission, so the same person can send another
  note immediately.
- Entries are cleared by Settings → Data & privacy, together with the rest of the sample data.

## Patient reports & prescriptions

Two care-team flows connect the patient and doctor sides, both built on **shared** collections
(like appointment requests) so the two roles cooperate on the same device.

### Reports a patient uploads are visible to the doctor

- When a signed-in **patient** uploads a medical record, a labelled copy is added to the shared
  care-team inbox (`health-copilot:patient-records`) alongside the patient's own library entry.
- The **doctor** portal has a **Patient reports** page listing every shared report newest-first,
  with the patient's name and email, and a filter for **New / Reviewed**. The same reports also
  appear under **Shared by the patient** inside the patient's file on the roster.
- Marking a report **Mark as seen** records who reviewed it and sends the patient an **in-app
  notification** that their report was reviewed. Patients can also see the status in their records.
- Files are still metadata-only — no document is uploaded, opened or analysed.

### Only doctors can write prescriptions

- The patient **Prescriptions** page is **read-only**: patients can view their medicines and mark
  doses as taken, but there is no add/edit/delete.
- In the doctor portal, **Prescriptions → New prescription** opens a form where the clinician
  **selects one of their patients from a dropdown** and adds the medication (name, dosage,
  frequency, start date, status, notes). The same form is reachable with the patient pre-selected
  from their file (**Prescribe**).
- Submitting **delivers the medication into that patient's own medicine list** and raises an
  **in-app notification**. The doctor side keeps a shared ledger
  (`health-copilot:prescriptions`) of everything prescribed, with the patient's name attached.
- These are **in-app demo notifications only** — no email, SMS or push is sent.

## Health analytics data

- **All readings are fictional.** `src/data/demoHealthData.ts` generates 90 days of daily
  samples in the browser from a fixed seed, tuned to plausible adult ranges (resting heart
  rate 54–88 bpm, blood pressure 104–142/62–94 mmHg, sleep 4.4–9.4 h, steps 2,100–17,800,
  weight 71–82 kg) with day-to-day noise and a gentle improving trend. No device, wearable
  or clinic is connected.
- Summary cards average the selected window and compare it with the previous window of
  equal length; charts plot daily points (7/30 days) or weekly averages (90 days).
- **Weight is user-editable.** Health Analytics → Weight → Edit weight stores your reading
  per account (`health-copilot:weight-kg:<userId>`); it replaces the generated sample on
  the chart and is cleared by Settings → Data & privacy or Reset to sample.

## Data & persistence

- The two built-in persona accounts are seeded from `src/data/*` (fictional).
- Every account's data lives in `localStorage` under its own
  `health-copilot:<key>:<userId>` namespace, so data is always related to the user
  signed in. The built-in patient persona keeps its stable seeded id
  (`user_sample_patient`) so the same device sees the same sample data whether the
  account signs in locally or through Firebase.
- **Appointment requests, feedback, patient reports and prescriptions are the shared
  exceptions** — they live under unscoped `health-copilot:appointment-requests`,
  `health-copilot:feedback`, `health-copilot:patient-records` and `health-copilot:prescriptions`
  keys so both sides of the demo can act on the same applications, read the same feedback board,
  review the reports patients share, and list the prescriptions doctors write (see
  [Appointment requests](#appointment-requests), [Feedback board](#feedback-board) and
  [Patient reports & prescriptions](#patient-reports--prescriptions)). A prescription's
  medication itself is written into the patient's own scoped medicine list when it is issued.
- `storageService` degrades gracefully: if storage is blocked (private mode), the app
  falls back to in-memory state for the session.
- Settings → **Data & privacy** shows storage usage and lets you reset your data.

## Limitations & safety

- **Real accounts, no clinic.** Sign-in is real Firebase Auth, but no hospital or clinic
  is connected — nothing is booked with, sent to, or read by a provider.
- **One role per account.** Accounts are locked to their role — a patient account cannot
  sign in as a doctor, and the doctor sample account cannot sign in as a patient.
- **No OCR / document analysis.** Uploads store metadata only (title, category, provider,
  date); photos are kept as previews in conversations. Files and images are never
  analysed.
- **Educational AI only.** The assistant gives general education and never diagnoses or
  prescribes. It explains only what you type, links to general sources, and escalates
  emergencies deterministically to **112**. Connecting a real AI model requires your own
  server-side endpoint (`VITE_AI_PROVIDER=remote`); API keys never ship in the browser bundle.
- **No real bookings or notifications.** Appointments are local entries; no email, SMS or
  push is ever sent.
- **Browser storage, not a records database.** Convenient and private to the device, but
  not a substitute for a clinical system — don't enter sensitive real medical details.
- **Fictional data only.** Metrics are generated from a fixed seed and come from no device
  or clinic.
- **Educational, not medical.** In an emergency, contact local emergency services.