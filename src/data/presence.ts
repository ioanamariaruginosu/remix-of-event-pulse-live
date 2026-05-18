import { useSyncExternalStore } from "react";
import { people } from "./event";

/**
 * Tiny in-memory presence store. Tracks which room each attendee is
 * currently in, plus a tap log. Organizers "tap" attendee phones at a
 * room door to sign them in — that flips their room and re-renders any
 * subscriber (network graph, occupancy meter, live feed).
 *
 * No backend yet — this is the canonical client-side source of truth.
 */

export type Tap = {
  id: string;
  personId: string;
  roomId: string;
  organizerId: string;
  at: number; // epoch ms
};

type State = {
  // personId -> roomId | null (null = not in any room)
  membership: Map<string, string | null>;
  taps: Tap[];
};

const state: State = {
  membership: new Map(people.map((p) => [p.id, p.roomId ?? null])),
  taps: [],
};

const listeners = new Set<() => void>();
function emit() {
  // create new identities so useSyncExternalStore re-renders
  state.membership = new Map(state.membership);
  state.taps = [...state.taps];
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// --- actions ---
export function tapInAttendee(personId: string, roomId: string, organizerId = "org") {
  state.membership.set(personId, roomId);
  state.taps = [
    { id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, personId, roomId, organizerId, at: Date.now() },
    ...state.taps,
  ].slice(0, 50);
  emit();
}

export function tapOutAttendee(personId: string) {
  state.membership.set(personId, null);
  emit();
}

// --- selectors ---
function getMembership() {
  return state.membership;
}
function getTaps() {
  return state.taps;
}

export function useMembership() {
  return useSyncExternalStore(subscribe, getMembership, getMembership);
}

export function useRecentTaps(roomId?: string) {
  const taps = useSyncExternalStore(subscribe, getTaps, getTaps);
  return roomId ? taps.filter((t) => t.roomId === roomId) : taps;
}

export function useRoomMemberIds(roomId: string) {
  const m = useMembership();
  const ids: string[] = [];
  m.forEach((rid, pid) => {
    if (rid === roomId) ids.push(pid);
  });
  return ids;
}

export function useRoomCount(roomId: string) {
  return useRoomMemberIds(roomId).length;
}
