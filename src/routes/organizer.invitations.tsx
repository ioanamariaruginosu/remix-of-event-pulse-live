import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { people, event } from "@/data/event";

export const Route = createFileRoute("/organizer/invitations")({
  head: () => ({ meta: [{ title: "Organizer · Invitations — synqmap" }] }),
  component: Invitations,
});

type InviteStatus = "sent" | "opened" | "accepted" | "declined" | "pending";

type Invite = {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  color: string;
  status: InviteStatus;
  sentAt: string;
};

const seed: Invite[] = people.slice(1, 14).map((p, i) => {
  const statuses: InviteStatus[] = ["accepted", "opened", "sent", "declined", "pending"];
  return {
    id: p.id,
    name: p.name,
    email: `${p.name.split(" ")[0].toLowerCase()}@example.com`,
    role: p.tags[0] ?? "guest",
    initials: p.initials,
    color: p.color,
    status: statuses[i % statuses.length],
    sentAt: `${(i % 9) + 1}d ago`,
  };
});

const statusTone: Record<InviteStatus, string> = {
  accepted: "bg-primary-soft text-primary",
  opened: "bg-accent/40 text-foreground",
  sent: "bg-foreground/5 text-foreground/60",
  declined: "bg-destructive/10 text-destructive",
  pending: "bg-foreground/5 text-foreground/40",
};

function Invitations() {
  const [invites, setInvites] = useState<Invite[]>(seed);
  const [bulk, setBulk] = useState("");
  const [filter, setFilter] = useState<"all" | InviteStatus>("all");
  const [template, setTemplate] = useState(
    `You're invited to ${event.name}.\n\nJoin a small, curated room of founders, researchers, and designers — your map of the event starts the moment you walk in.\n\nTap the link below to claim your spot.`,
  );

  const filtered = useMemo(
    () => (filter === "all" ? invites : invites.filter((i) => i.status === filter)),
    [invites, filter],
  );

  const stats = useMemo(() => {
    const total = invites.length;
    const accepted = invites.filter((i) => i.status === "accepted").length;
    const opened = invites.filter((i) => i.status === "opened" || i.status === "accepted").length;
    return { total, accepted, opened, rate: total ? Math.round((accepted / total) * 100) : 0 };
  }, [invites]);

  const sendBulk = () => {
    const emails = bulk
      .split(/[\s,;\n]+/)
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));
    if (!emails.length) return;
    const newOnes: Invite[] = emails.map((email, i) => ({
      id: `new-${Date.now()}-${i}`,
      name: email.split("@")[0].replace(/[._-]/g, " "),
      email,
      role: "guest",
      initials: email.slice(0, 2).toUpperCase(),
      color: "#7c3aed",
      status: "sent",
      sentAt: "just now",
    }));
    setInvites((arr) => [...newOnes, ...arr]);
    setBulk("");
  };

  return (
    <div className="p-8 lg:p-12 max-w-6xl space-y-10">
      <div>
        <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-2">
          {event.name}
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight">Invitations</h1>
        <p className="text-foreground/60 mt-2 max-w-xl">
          Curate the room. Send personal invites or paste a list — track who's coming in real time.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Sent" value={stats.total.toString()} />
        <Stat label="Opened" value={stats.opened.toString()} />
        <Stat label="Accepted" value={stats.accepted.toString()} accent />
        <Stat label="Accept rate" value={`${stats.rate}%`} />
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
        <section className="p-6 rounded-3xl ring-1 ring-border space-y-4 bg-background">
          <div>
            <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-1">
              Bulk invite
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">Paste emails</h2>
          </div>
          <textarea
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder="maya@northbeam.io, sam@tracegraph.dev&#10;lena@proto.vc"
            className="w-full h-32 px-4 py-3 rounded-xl bg-transparent ring-1 ring-border focus:ring-primary outline-none text-sm font-mono resize-none"
            style={{ fontFamily: "ui-monospace, monospace" }}
          />
          <div className="flex items-center justify-between">
            <div className="text-xs text-foreground/40">
              Separate with commas, spaces, or new lines.
            </div>
            <button
              onClick={sendBulk}
              className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90"
            >
              Send invites →
            </button>
          </div>
        </section>

        <section className="p-6 rounded-3xl ring-1 ring-border space-y-4 bg-background">
          <div>
            <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-1">
              Message
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">Invitation template</h2>
          </div>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full h-32 px-4 py-3 rounded-xl bg-transparent ring-1 ring-border focus:ring-primary outline-none text-sm leading-relaxed resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="text-xs text-foreground/40">
              {template.length} chars · personalized with first name
            </div>
            <button className="px-4 py-2 ring-1 ring-border rounded-xl font-bold text-sm hover:bg-foreground/5">
              Preview
            </button>
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-1">
              Roster
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">Invited guests</h2>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl ring-1 ring-border">
            {(["all", "accepted", "opened", "sent", "declined", "pending"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  filter === f
                    ? "bg-foreground text-white"
                    : "text-foreground/60 hover:bg-foreground/5"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl ring-1 ring-border overflow-hidden">
          {filtered.map((inv, i) => (
            <div
              key={inv.id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-5 py-3 border-b border-border last:border-b-0 hover:bg-foreground/[0.02]"
            >
              <div
                className="size-8 rounded-full grid place-items-center text-[10px] font-bold text-white"
                style={{ background: inv.color }}
              >
                {inv.initials}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm truncate">{inv.name}</div>
                <div className="text-xs text-foreground/40 truncate">{inv.email}</div>
              </div>
              <div className="text-[10px] font-display italic uppercase tracking-widest text-foreground/40 hidden md:block">
                {inv.role}
              </div>
              <span
                className={`text-[9px] font-display italic font-bold uppercase tracking-widest px-2 py-1 rounded ${statusTone[inv.status]}`}
              >
                {inv.status}
              </span>
              <div className="text-xs text-foreground/40 hidden md:block w-16 text-right">
                {inv.sentAt}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-foreground/40">
              No invites match this filter.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`p-5 rounded-2xl ring-1 ${accent ? "ring-primary/20 bg-primary-soft" : "ring-border"}`}>
      <div className="font-display italic text-3xl font-extrabold tracking-tight">{value}</div>
      <div className="text-[10px] text-foreground/40 uppercase font-bold tracking-widest mt-1">
        {label}
      </div>
    </div>
  );
}
