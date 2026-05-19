## Goal
Replace the in-memory mock stores with a real backend on **Lovable Cloud** (Postgres + Auth + RLS), wiring up the screens that matter most. Less-critical surfaces (Wrapped, Past events, ticker copy) stay hardcoded for now.

## Phase 1 — Foundation
- Enable Lovable Cloud.
- Add **Auth** (email + password). One screen: `/join` becomes a real sign-in/sign-up; `/organizer` requires a row in `user_roles` with role `organizer`.
- `user_roles` table + `has_role()` security-definer function (per security best practice).
- `profiles` table auto-populated by trigger on `auth.users` insert (name, one-liner, intent, tags, socials, gradient).

## Phase 2 — Core event domain
Tables (all RLS-protected):
- `events` (name, dates, city, owner)
- `rooms` (event_id, name, kind, capacity)
- `sessions` (event_id, room_id, title, speaker, speaker_role, time, abstract, topics[])
- `event_attendees` (event_id, user_id, status) — registration
- `invitations` (event_id, email, token, status)

Wires up:
- Organizer: create event, add rooms, add sessions, send invitations.
- Attendee: list of registered events, sessions feed per event.

## Phase 3 — Live presence & cards
- `presence` (event_id, user_id, room_id, updated_at) — replaces `presence.ts`.
- `taps` (event_id, person_id, room_id, organizer_id, at) — organizer door tap-in log.
- `cards_exchanged` (event_id, from_user, to_user, reason, at) — replaces graph edges.
- Realtime subscriptions for the live organizer dashboard + attendee map/room screens.

## Phase 4 — Seed data
Load the **8 uploaded session transcripts** into a default event ("START Summit") with rooms + sessions + speakers. The mock attendees PDF stays hardcoded as demo accounts we insert via a one-time seed.

## What stays hardcoded for now
- Wrapped / Past events screens (purely visual recap).
- Ticker copy, gradient presets, font picker.
- Brief transcript drip animation (uses one canned session).
- Avatar/collection visual flourishes.

## Technical notes
- **Server functions** (`createServerFn` + `requireSupabaseAuth`) for all writes and authenticated reads.
- **Direct supabase client** (RLS) only for realtime subscriptions on presence/taps.
- Roles in a dedicated `user_roles` table — never on profiles.
- Mock data files (`src/data/event.ts`, `presence.ts`) become thin adapters that call server functions / subscribe to realtime, so existing components keep working with minimal changes.
- One migration per phase so we can verify before moving on.

## Order of execution
1. Enable Cloud, create auth + roles + profiles, wire `/join` and organizer gate.
2. Events/rooms/sessions schema + organizer CRUD screens.
3. Presence + taps + cards realtime.
4. Seed the START Summit data from the uploaded transcripts.

Each phase is independently testable. After phase 1 you'll already be able to log in.
