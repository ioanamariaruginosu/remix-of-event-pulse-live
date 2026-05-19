import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { NetworkGraph } from "@/components/NetworkGraph";
import { Avatar } from "@/components/Avatar";
import { RoomPhotos } from "@/components/RoomPhotos";
import { LiveChat } from "@/components/LiveChat";
import { EventMap } from "@/components/EventMap";
import { people, rooms, sessions } from "@/data/event";
import { getMyPresence } from "@/lib/presence.functions";




export const Route = createFileRoute("/app/room")({
  head: () => ({ meta: [{ title: "Room — synqmap" }] }),
  component: RoomView,
});

function RoomView() {
  // Position you're actually checked into (set only when an organizer scans
  // your QR at a door). null until you've been checked in anywhere.
  const [myRoomName, setMyRoomName] = useState<string | null>(null);
  // The room you're currently browsing in the UI — purely navigational.
  const [viewingRoomId, setViewingRoomId] = useState("track-a");
  const viewing = rooms.find((r) => r.id === viewingRoomId)!;
  const here = people.filter((p) => p.roomId === viewingRoomId && p.id !== "you");
  const session = sessions.find((s) => s.roomId === viewingRoomId);

  // Match my server-side room name back to the local mock so we can highlight it.
  const myMockRoom = myRoomName
    ? rooms.find((r) => r.name.toLowerCase() === myRoomName.toLowerCase()) ?? null
    : null;
  const isViewingMyRoom = myMockRoom?.id === viewingRoomId;

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      getMyPresence()
        .then((p) => {
          if (!cancelled) setMyRoomName(p.roomName);
        })
        .catch(() => {
          if (!cancelled) setMyRoomName(null);
        });
    };
    refresh();
    const id = setInterval(refresh, 10_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="px-5 pt-6 space-y-5">
      <div className="bg-primary text-white -mx-5 -mt-6 px-5 pt-4 pb-5">
        <div className="flex items-center gap-2 text-[10px] font-display italic tracking-tight normal-case text-white/60">
          <span className="size-1.5 bg-white rounded-full animate-pulse" />
          {myRoomName
            ? `Checked in · ${myRoomName}`
            : "Not checked in — show your QR at a door"}
        </div>
        <div className="font-extrabold text-2xl tracking-tight mt-1">{viewing.name}</div>
        <div className="text-xs text-white/70">
          {isViewingMyRoom ? "You're here · " : "Browsing · "}
          {viewing.current} people · {Math.round((viewing.current / viewing.capacity) * 100)}% full
        </div>
      </div>

      <div>
        <div className="text-[9px] font-display italic text-foreground/40 uppercase tracking-widest mb-2">
          Browse rooms · your position is set at the door
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          {rooms.map((r) => (
            <button
              key={r.id}
              onClick={() => setViewingRoomId(r.id)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap uppercase tracking-widest flex items-center gap-1.5 ${
                viewingRoomId === r.id ? "bg-foreground text-white" : "bg-foreground/5 text-foreground/60"
              }`}
            >
              {r.name}
              {myMockRoom?.id === r.id && (
                <span className="size-1.5 rounded-full bg-primary" aria-label="You are here" />
              )}
            </button>
          ))}
        </div>
      </div>
      <EventMap
        eventId="current"
        role="attendee"
        title="You are here · Floor 1"
        activeRoomId={viewingRoomId}
        onSelectRoom={setViewingRoomId}
        showLivePosition
      />






      <div className="aspect-square bg-foreground rounded-2xl overflow-hidden">
        <NetworkGraph scale="room" roomId={viewingRoomId} height={320} showLabels />
      </div>

      {session && (
        <div className="p-4 ring-1 ring-border rounded-2xl">
          <div className="text-[9px] font-display italic text-primary font-bold uppercase tracking-widest mb-1">Now on stage</div>
          <div className="font-bold tracking-tight">{session.title}</div>
          <div className="text-xs text-foreground/60 mt-1">{session.speaker} · {session.time}</div>
          <Link to="/app/brief" className="mt-3 inline-block text-xs font-bold text-primary">View live brief →</Link>
        </div>
      )}

      <div>
        <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest mb-3">Who you should meet here</div>
        <div className="space-y-2">
          {here.slice(0, 5).map((p, i) => (
            <div key={p.id} className={`p-3 rounded-xl flex items-center gap-3 ${i === 0 ? "bg-primary-soft ring-1 ring-primary/20" : "ring-1 ring-border"}`}>
              <Avatar person={p} size={40} className="ring-2 ring-background shadow-sm" />

              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{p.name}</div>
                <div className="text-[10px] text-foreground/50 truncate">{p.intent}</div>
              </div>
              {i === 0 && (
                <div className="text-[9px] font-display italic font-bold text-primary uppercase tracking-widest italic">Match</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <LiveChat roomId={viewingRoomId} />

      <RoomPhotos roomId={viewingRoomId} />
    </div>
  );
}

