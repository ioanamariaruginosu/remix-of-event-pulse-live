# Plan: Eurhack-style live event networking prototype

Frontend-only, all data hardcoded in TS fixtures. No backend, no BLE, no AI — everything is faked but feels alive (simulated ticks, scripted "events arriving"). Vibe target: eventlabs.ai — dark, high-contrast, glowing graph aesthetics, generous type, subtle motion, gamified HUD feel.

## Scope (what ships)

Three personas, one shared graph dataset, hardcoded.

### 1. Marketing / entry surface

- `/` — landing page in EventLabs spirit: bold display type, animated hero graph, "Organizer" and "Join event" entry points, sections explaining rooms-vs-sessions, identity cards, the three graph scales.

### 2. Organizer (CMS-style, fake data)

- `/organizer` — event dashboard: event name (Eurhack 2026), dates, branding swatch, KPIs.
- `/organizer/rooms` — list/edit rooms (Main Stage, Track A, Coffee Bar, Lounge), tag as session room vs social space, mock QR.
- `/organizer/sessions` — schedule grid by room × time, speaker + abstract.
- `/organizer/live` — live ops HUD: room density bars, hot topics, connection rate sparkline, "Project to venue screen" button.

### 3. Participant (phone-frame UI)

- `/join` — 30-second onboarding: scan-event mock, intent prompt, identity card builder (name, photo, one-liner, intent, 1–3 tags, socials).
- `/app` — personal view (default): your node centered, 3 highlighted moves (closest match, bridge person, blind-spot cluster), card collection count, XP-style progress.
- `/app/room` — auto-detected room view: who's here, current session, live questions, suggested intros. Fake BLE: a banner "Detected: Track A" with a room-switcher for demo.
- `/app/card` — your identity card, shareable artifact look.
- `/app/exchange` — tap-to-exchange flow (mock): two-phone animation, vibrate cue, "why you matched" reveal, card lands in collection.
- `/app/collection` — stack of received cards.
- `/app/brief/:sessionId` — post-session AI brief (hardcoded markdown).
- `/app/map` — end-of-day personal map artifact (downloadable-feel PNG-style frame).

### 4. Venue screen (the spectacle)

- `/venue` — fullscreen dark canvas, full network graph pulsing, scripted live events ticker ("Maya joined Track A", "New edge: Sam ↔ Lena"), big topic clusters glowing.

## Mental model in the data

```text
Event ─┬─ Rooms (physical, persistent)
       │    └─ Sessions (temporal, scheduled in a room)
       ├─ Participants ─ IdentityCard
       └─ Graph
            ├─ nodes: people, topics, questions
            └─ edges: exchanges, attendance, topic-affinity
```

All in `src/data/` as typed fixtures. ~30 people, 4 rooms, 6 sessions, ~80 edges, ~15 topics — enough to make the graph feel dense.

## Visual direction

- White theme, purple accents.
- Display font: a distinctive sans (e.g. Space Grotesk / Sora) + mono accents for HUD numbers.
- Gamified cues: XP bar, streaks, "match earned" toasts, subtle haptic-style flashes, count-ups.
- Graph: `react-force-graph-2d` for in-app views, larger canvas variant on `/venue` with bloom-ish glow.
- Motion: Motion for React for page transitions, card flips, exchange animation. Restrained — one hero animation per surface.

I will run `design--create_directions` after plan approval to lock the exact palette/typography/composition before building.

## Technical notes

- Stack already in place: TanStack Start + Tailwind v4 + shadcn. Add: `motion`, `react-force-graph-2d`, `lucide-react` (likely already there).
- Routing: file-based under `src/routes/` using the dot-separated convention (`organizer.rooms.tsx`, `app.room.tsx`, etc.). Layout routes (`organizer.tsx`, `app.tsx`) render `<Outlet />` with their respective chrome (sidebar for organizer, phone frame for participant).
- Per-route `head()` metadata on every shareable page.
- Phone-frame component wraps participant routes so the mobile UI is viewable on desktop demo.
- Fake "live" behavior: a small `useSimulatedTick` hook drives scripted events on `/organizer/live` and `/venue` from a timeline array.
- No auth, no persistence; switching personas is just navigating to a different URL. Top-right "Demo switcher" floating button lets the judge jump between Organizer / Participant / Venue.

## What I'm NOT building (per your triage)

- Real BLE, real transcription, real AI, any backend, remote-attendee view, real auth.
- Live ops is visual only; the dashboard moves but isn't wired to participant actions.

## Build order

1. Design directions → pick one.
2. Tokens + phone frame + demo switcher chrome.
3. Hardcoded fixtures + graph component (reused at 3 scales).
4. Participant flow (onboarding → room → personal → exchange → collection).
5. Organizer flow (dashboard → rooms → sessions → live).
6. Venue screen spectacle.
7. Landing page last, using real screenshots of the built app.

After approval I'll generate 3 design directions for you to pick from before writing any app code.