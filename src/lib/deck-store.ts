const KEY = "synqmap:deck";
const EVENT = "synqmap:deck:changed";

export type StoredCard = { personId: string; reason: string; at: number };

function read(): StoredCard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredCard[]) : [];
  } catch {
    return [];
  }
}

function write(cards: StoredCard[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(cards));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function getStoredDeck(): StoredCard[] {
  return read();
}

export function addToDeck(personId: string, reason = "Exchanged via QR · they also got your card") {
  const cards = read();
  if (cards.some((c) => c.personId === personId)) return;
  cards.unshift({ personId, reason, at: Date.now() });
  write(cards);
}

export function subscribeDeck(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}